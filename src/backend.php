<?php

require_once '../conexao.php';
require_once '../config.php';

$conexao = (new conexao())->getConexao();

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'valida_senha':
            $senha = $_GET['senha'] ?? '';
            if ($senha === senhaAdmin) {
                echo json_encode(['valid' => true]);
            } else {
                echo json_encode(['valid' => false]);
            }
            break;

        case 'get_respostas':
            $salaId = isset($_GET['sala_id']) ? (int) $_GET['sala_id'] : 0;
            if ($salaId > 0) {
                $stmt = $conexao->prepare('
                    SELECT r.*, p.descricao as pergunta_descricao, p.ordem_exibicao as pergunta_ordem 
                    FROM respostas r 
                    LEFT JOIN perguntas p ON r.pergunta_id = p.id 
                    WHERE r.ativo = true AND r.sala_id = :sala_id 
                    ORDER BY r.data_hora DESC
                ');
                $stmt->execute([':sala_id' => $salaId]);
            } else {
                $stmt = $conexao->query('
                    SELECT r.*, p.descricao as pergunta_descricao, p.ordem_exibicao as pergunta_ordem 
                    FROM respostas r 
                    LEFT JOIN perguntas p ON r.pergunta_id = p.id 
                    WHERE r.ativo = true 
                    ORDER BY r.data_hora DESC
                ');
            }
            $respostas = $stmt->fetchAll();
            echo json_encode($respostas);
            break;

        case 'get_feedback':
            $idRespostas = isset($_GET['id_respostas']) ? $_GET['id_respostas'] : '';
            if (empty($idRespostas)) {
                echo json_encode(null);
                exit;
            }
            $stmt = $conexao->prepare('SELECT descricao FROM feedback WHERE id_respostas = :id_respostas LIMIT 1');
            $stmt->execute([':id_respostas' => $idRespostas]);
            $feedback = $stmt->fetch();
            echo json_encode($feedback ?: null);
            break;

        case 'get_salas':
            $stmt = $conexao->query('SELECT id, descricao FROM salas WHERE ativo = true ORDER BY descricao');
            $salas = $stmt->fetchAll();
            echo json_encode($salas);
            break;

        case 'get_perguntas':
            $salaId = isset($_GET['sala_id']) ? (int) $_GET['sala_id'] : 0;
            if ($salaId <= 0) {
                echo json_encode([]);
                exit;
            }
            $stmt = $conexao->prepare('SELECT id, descricao, ordem_exibicao FROM perguntas WHERE sala_id = :sala_id AND ativo = true ORDER BY ordem_exibicao');
            $stmt->execute([':sala_id' => $salaId]);
            $perguntas = $stmt->fetchAll();
            echo json_encode($perguntas);
            break;

        case 'get_todas_perguntas':
            $stmt = $conexao->query('SELECT id, descricao, sala_id, ordem_exibicao FROM perguntas WHERE ativo = true ORDER BY sala_id, ordem_exibicao');
            $perguntas = $stmt->fetchAll();
            echo json_encode($perguntas);
            break;

        case 'get_respostas_por_pergunta':
            $perguntaId = isset($_GET['pergunta_id']) ? (int) $_GET['pergunta_id'] : 0;
            if ($perguntaId <= 0) {
                echo json_encode([]);
                exit;
            }
            $stmt = $conexao->prepare('SELECT id, sala_id, nota, data_hora FROM respostas WHERE pergunta_id = :pergunta_id AND ativo = true ORDER BY data_hora DESC');
            $stmt->execute([':pergunta_id' => $perguntaId]);
            $respostas = $stmt->fetchAll();
            echo json_encode($respostas);
            break;
        
        case 'salvar_respostas':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            // Verifica se os dados são um array
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }

            // Envia os dados coletados das respostas para o banco
            try {
                $conexao->beginTransaction();
                $insert = $conexao->prepare('INSERT INTO respostas (pergunta_id, sala_id, nota, data_hora, id_respostas) VALUES (:pergunta_id, :sala_id, :nota, :data_hora, :id_respostas)');
                foreach ($data as $resposta) {
                    // Validações simples
                    $pid = isset($resposta['pergunta_id']) ? (int) $resposta['pergunta_id'] : null;
                    $sid = isset($resposta['sala_id']) ? (int) $resposta['sala_id'] : null;
                    $nota = isset($resposta['nota']) ? (int) $resposta['nota'] : null;
                    $data_hora = isset($resposta['data_hora']) ? $resposta['data_hora'] : null;
                    $id_respostas = isset($resposta['id_respostas']) ? $resposta['id_respostas'] : null;
                    if (!$pid || !$sid || !$nota || !$data_hora || !$id_respostas) {
                        // rollback e erro
                        $conexao->rollBack();
                        http_response_code(400);
                        echo json_encode(['error' => 'Resposta com dados faltando ou inválidos', 'item' => $resposta]);
                        exit;
                    }
                    try{
                        // tenta executar a inserção no prepare
                        $insert->execute([':pergunta_id' => $pid, ':sala_id' => $sid, ':nota' => $nota, ':data_hora' => $data_hora, ':id_respostas' => $id_respostas]);
                    } catch (Exception $e){
                        // rollback e erro
                        $conexao->rollBack();
                        http_response_code(500);
                        echo json_encode(['error' => 'Erro ao salvar resposta: ' . $e->getMessage(), 'item' => $resposta]);
                        exit;
                    }
                }
                // commit se tudo der certo
                $conexao->commit();
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                // rollback e erro
                $conexao->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao salvar respostas: ' . $e->getMessage()]);
            }

            break;

        case 'salvar_feedback':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            // Verifica se os dados são um array
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }

            // Extrai os dados do feedback
            $descricao = isset($data['descricao']) ? trim($data['descricao']) : '';
            $id_respostas = isset($data['id_respostas']) ? $data['id_respostas'] : '';

            // Prepara a inserção do feedback
            $conexao->beginTransaction();
            $insert = $conexao->prepare('INSERT INTO feedback (descricao, id_respostas) VALUES (:descricao, :id_respostas)');
                
            try{
                // tenta executar a inserção no prepare
                $insert->execute([':descricao' => $descricao, ':id_respostas' => $id_respostas]);
            } catch (Exception $e){
                // rollback e erro
                $conexao->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao salvar feedback: ' . $e->getMessage(), 'item' => $feedback]);
                exit;
            }
            // commit se tudo der certo
            $conexao->commit();
            echo json_encode(['success' => true]);
            break;

        case 'criar_pergunta':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $sala_id = isset($data['sala_id']) ? (int) $data['sala_id'] : 0;
            $descricao = isset($data['descricao']) ? trim($data['descricao']) : '';
            
            if ($sala_id <= 0 || empty($descricao)) {
                http_response_code(400);
                echo json_encode(['error' => 'Sala ID e descrição são obrigatórios']);
                exit;
            }
            
            try {
                // Busca a maior ordem_exibicao da sala
                $stmtMax = $conexao->prepare('SELECT MAX(ordem_exibicao) as max_ordem FROM perguntas WHERE sala_id = :sala_id');
                $stmtMax->execute([':sala_id' => $sala_id]);
                $resultado = $stmtMax->fetch();
                $proximaOrdem = ($resultado && $resultado['max_ordem'] !== null) ? $resultado['max_ordem'] + 1 : 1;
                
                $stmt = $conexao->prepare('INSERT INTO perguntas (descricao, sala_id, ordem_exibicao) VALUES (:descricao, :sala_id, :ordem_exibicao)');
                $stmt->execute([':descricao' => $descricao, ':sala_id' => $sala_id, ':ordem_exibicao' => $proximaOrdem]);
                echo json_encode(['success' => true, 'id' => $conexao->lastInsertId()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao criar pergunta: ' . $e->getMessage()]);
            }
            break;

        case 'editar_pergunta':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $id = isset($data['id']) ? (int) $data['id'] : 0;
            $descricao = isset($data['descricao']) ? trim($data['descricao']) : '';
            
            if ($id <= 0 || empty($descricao)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID e descrição são obrigatórios']);
                exit;
            }
            
            try {
                $stmt = $conexao->prepare('UPDATE perguntas SET descricao = :descricao WHERE id = :id');
                $stmt->execute([':descricao' => $descricao, ':id' => $id]);
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao editar pergunta: ' . $e->getMessage()]);
            }
            break;

        case 'excluir_pergunta':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $id = isset($data['id']) ? (int) $data['id'] : 0;
            
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'ID é obrigatório']);
                exit;
            }
            
            try {
                // Soft delete: apenas marca como inativo
                $stmt = $conexao->prepare('UPDATE perguntas SET ativo = false WHERE id = :id');
                $stmt->execute([':id' => $id]);
                
                    echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao excluir pergunta: ' . $e->getMessage()]);
            }
            break;

        case 'get_all_feedbacks':
            $stmt = $conexao->query('SELECT DISTINCT id_respostas FROM feedback WHERE id_respostas IS NOT NULL AND id_respostas != \'\' ');
            $feedbacks = $stmt->fetchAll();
            echo json_encode($feedbacks);
            break;

        case 'atualizar_ordem_perguntas':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            
            if (!is_array($data) || !isset($data['perguntas'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            try {
                $conexao->beginTransaction();
                $stmt = $conexao->prepare('UPDATE perguntas SET ordem_exibicao = :ordem WHERE id = :id');
                
                foreach ($data['perguntas'] as $pergunta) {
                    if (!isset($pergunta['id']) || !isset($pergunta['ordem_exibicao'])) {
                        $conexao->rollBack();
                        http_response_code(400);
                        echo json_encode(['error' => 'Pergunta com dados incompletos']);
                        exit;
                    }
                    
                    $stmt->execute([
                        ':id' => (int) $pergunta['id'],
                        ':ordem' => (int) $pergunta['ordem_exibicao']
                    ]);
                }
                
                $conexao->commit();
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                $conexao->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao atualizar ordem: ' . $e->getMessage()]);
            }
            break;

        default:
            echo json_encode(['error' => 'Ação inválida']);
            break;
    }
} catch (Exception $e) {
    if (isset($conexao) && $conexao->inTransaction()) {
        $conexao->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>
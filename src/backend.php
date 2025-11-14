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
            $stmt = $conexao->query('SELECT * FROM respostas WHERE ativo = true ORDER BY data_hora DESC');
            $respostas = $stmt->fetchAll();
            echo json_encode($respostas);
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
            $stmt = $conexao->prepare('SELECT id, descricao FROM perguntas WHERE sala_id = :sala_id AND ativo = true ORDER BY id');
            $stmt->execute([':sala_id' => $salaId]);
            $perguntas = $stmt->fetchAll();
            echo json_encode($perguntas);
            break;

        case 'get_todas_perguntas':
            $stmt = $conexao->query('SELECT id, descricao, sala_id FROM perguntas WHERE ativo = true ORDER BY sala_id, id');
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
                $stmt = $conexao->prepare('INSERT INTO perguntas (descricao, sala_id) VALUES (:descricao, :sala_id)');
                $stmt->execute([':descricao' => $descricao, ':sala_id' => $sala_id]);
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
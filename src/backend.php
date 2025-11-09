<?php

require_once '../config.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_salas':
            $stmt = $conexao->query('SELECT id, descricao FROM salas ORDER BY descricao');
            $salas = $stmt->fetchAll();
            echo json_encode($salas);
            break;

        case 'get_perguntas':
            $salaId = isset($_GET['sala_id']) ? (int) $_GET['sala_id'] : 0;
            if ($salaId <= 0) {
                echo json_encode([]);
                exit;
            }
            $stmt = $conexao->prepare('SELECT id, descricao FROM perguntas WHERE sala_id = :sala_id ORDER BY id');
            $stmt->execute([':sala_id' => $salaId]);
            $perguntas = $stmt->fetchAll();
            echo json_encode($perguntas);
            break;
        
        case 'salvar_respostas':
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }

            try {
                $conexao->beginTransaction();
                $insert = $conexao->prepare('INSERT INTO respostas (pergunta_id, sala_id, nota, data_hora) VALUES (:pergunta_id, :sala_id, :nota, :data_hora)');
                foreach ($data as $resposta) {
                    // Validações simples
                    $pid = isset($resposta['pergunta_id']) ? (int) $resposta['pergunta_id'] : null;
                    $sid = isset($resposta['sala_id']) ? (int) $resposta['sala_id'] : null;
                    $nota = isset($resposta['nota']) ? (int) $resposta['nota'] : null;
                    $data_hora = isset($resposta['data_hora']) ? $resposta['data_hora'] : null;
                    if (!$pid || !$sid || !$nota || !$data_hora) {
                        // rollback e erro
                        $conexao->rollBack();
                        http_response_code(400);
                        echo json_encode(['error' => 'Resposta com dados faltando ou inválidos', 'item' => $resposta]);
                        exit;
                    }
                    try{
                        $insert->execute([':pergunta_id' => $pid, ':sala_id' => $sid, ':nota' => $nota, ':data_hora' => $data_hora]);
                    } catch (Exception $e){
                        $conexao->rollBack();
                        http_response_code(500);
                        echo json_encode(['error' => 'Erro ao salvar resposta: ' . $e->getMessage(), 'item' => $resposta]);
                        exit;
                    }
                }
                // $conexao->commit();
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                $conexao->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao salvar respostas: ' . $e->getMessage()]);
            }
            break;

        default:
            echo json_encode(['error' => 'Ação inválida']);
            break;
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}

// Encerramento implícito do PDO ao final do script
?>
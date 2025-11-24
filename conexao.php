<?php

    // Busca as variaveis de configuração para conexão com o banco de dados
    require_once '../config.php';

    class conexao{

        private $conexao;

        // Construtor da classe de conexão
        function __construct(){
            try {
                $dadosConexao = "pgsql:host=" . dbHost . ";port=" . dbPort . ";dbname=" . dbName . ";";
                $this->conexao = new PDO($dadosConexao, dbUser, dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            
                $this->conexao->exec("SET search_path TO \"".dbschema."\"");
            
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro de conexão: ' . $e->getMessage()]);
                exit;
            }
        }

        // Retorna a conexão com o banco de dados
        public function getConexao(){
            return $this->conexao;
        }

    }

?>
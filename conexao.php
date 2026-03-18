<?php

    // Busca as variaveis de configuração para conexão com o banco de dados
    require_once '../config.php';

    class conexao{

        private $conexao;

        // Construtor da classe de conexão
        function __construct(){
            try {
                // Adicionado sslmode=require para funcionamento no Supabase
                // Credenciais passadas DENTRO da DSN para evitar bugs do driver PDO_pgsql antigo
                $dadosConexao = "pgsql:host=" . dbHost . ";port=" . dbPort . ";dbname=" . dbName . ";user=" . dbUser . ";password=" . dbPass . ";sslmode=require;";
                $this->conexao = new PDO($dadosConexao, null, null, [
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
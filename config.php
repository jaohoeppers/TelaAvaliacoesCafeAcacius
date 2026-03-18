<?php

// Tenta carregar o arquivo .env se estiver rodando localmente
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $linhas = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        // Ignora comentários
        if (strpos(trim($linha), '#') === 0) continue;
        
        // Separa chave e valor
        if (strpos($linha, '=') !== false) {
            list($nome, $valor) = explode('=', $linha, 2);
            $nome = trim($nome);
            $valor = trim($valor);
            
            // Só define se a variável ainda não existir no ambiente
            if (!array_key_exists($nome, $_SERVER) && !array_key_exists($nome, $_ENV)) {
                putenv(sprintf('%s=%s', $nome, $valor));
                $_ENV[$nome] = $valor;
                $_SERVER[$nome] = $valor;
            }
        }
    }
}

// Define as constantes lendo das variáveis de ambiente (Vercel) ou do .env (Local)
// Caso o ambiente não possua, usa alguns valores "default" como segurança
DEFINE('dbHost', getenv('DB_HOST'));
DEFINE('dbPort', getenv('DB_PORT') ?: 6543);
DEFINE('dbName', getenv('DB_NAME') ?: 'postgres');
DEFINE('dbUser', getenv('DB_USER'));
DEFINE('dbPass', getenv('DB_PASS'));
DEFINE('dbschema', getenv('DB_SCHEMA') ?: 'dados');

// DADOS DE LOGIN PARA O ADMIN
DEFINE('senhaAdmin', getenv('SENHA_ADMIN') ?: '123');

?>
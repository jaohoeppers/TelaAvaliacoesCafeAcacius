# Sistema de Avaliações de Café

Sistema web para gerenciamento e realização de avaliações do café.

## Pré-requisitos

- PHP 7.4 ou superior
- PostgreSQL
- Servidor web Apache (XAMPP)

## Instalação

### 1. Configurar o Banco de Dados

Execute o dump SQL para criar o banco de dados e suas tabelas:

```bash
psql -U seu_usuario -d nome_do_banco < sql/dump-avaliacoes-202512042105.sql
```

Ou importe o arquivo `sql/dump-avaliacoes-202512042105.sql` através do pgAdmin ou outra ferramenta de gerenciamento PostgreSQL.

### 2. Configurar Conexão com o Banco de Dados

Crie um arquivo `config.php` na raiz do projeto com as seguintes constantes:

```php
<?php
DEFINE('dbHost', '<IP do Banco>');
DEFINE('dbPort', <Porta do Banco>);
DEFINE('dbName', 'Nome do Banco');
DEFINE('dbUser', 'Usuario');
DEFINE('dbPass', 'Senha');
DEFINE('dbschema', 'Schema');
DEFINE('senhaAdmin', 'Senha do Usuario');
?>
```

**Importante:** O arquivo `config.php` não está incluído no repositório por questões de segurança. Você deve criá-lo manualmente.

### 3. Configurar o Backend

O arquivo `public/js/config.js` contém as configurações do endpoint do backend do sistema.

Por padrão, está configurado para usar o endpoint online via NGROK:

```javascript
export const http = "https://90a99439ffb0.ngrok-free.app";
```

Para ambiente de desenvolvimento local, comente a linha acima e descomente:

```javascript
export const http = "http://localhost:80";
```

### 4. Iniciar o Servidor

Certifique-se de que clonou o repositório na pasta correta do seu servidor web (por exemplo, `htdocs` no XAMPP).

Certifique-se de que o Apache e PostgreSQL estão rodando e acesse:

```
http://localhost/progAvaliacoesCafe/public/
```

Ou configure o servidor web apontando para a pasta `public` do projeto.

## Estrutura do Projeto

```
progAvaliacoesCafe/
├── public/              # Arquivos públicos (HTML, CSS, JS)
│   ├── index.html       # Página inicial
│   ├── avaliacao.html   # Página de avaliações
│   ├── gestao.html      # Página de gestão
│   ├── css/             # Estilos
│   ├── js/              # Scripts JavaScript
│   └── models/          # Modelos de dados
├── src/                 # Backend PHP
│   └── backend.php      # API backend
├── sql/                 # Arquivos SQL
├── conexao.php          # Classe de conexão com BD
└── config.php           # Configurações (criar manualmente)
```

## Uso

1. Acesse a página inicial através do navegador
2. Utilize a interface de gestão para criar salas e perguntas
3. Compartilhe o link da sala para quem for avaliar
4. Acompanhe os resultados na tela de gestão
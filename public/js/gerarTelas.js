// Import para buscar a base da requisição http
import { http } from './config.js';
// Import dos modelos
import { Sala } from '../models/Sala.js';
import { Pergunta } from '../models/Pergunta.js';
import { Resposta } from '../models/Resposta.js';
import { Feedback } from '../models/Feedback.js';
import { Avaliacao } from '../models/Avaliacao.js';

// Variáveis globais para controle de paginação
let todasAsRespostas = [];
let paginaAtualRespostas = 1;
let respostasPorPergunta = {};
let paginaAtualPorPergunta = {};

// ========================================
// TELA GERAL
// ========================================

// Função para gerar a aba geral
export function gerarTelaGeral() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <h2>Visão Geral do Sistema</h2>
        
        <!-- Filtro de datas global -->
        <div class="filtro-datas-geral">
            <div class="filtro-grupo">
                <label for="dataInicialGeral">Data Inicial:</label>
                <input type="date" id="dataInicialGeral" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="filtro-grupo">
                <label for="dataFinalGeral">Data Final:</label>
                <input type="date" id="dataFinalGeral" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button class="btn-filtrar" onclick="aplicarFiltroGeral()">Aplicar Filtro</button>
            <button class="btn-limpar-filtro" onclick="limparFiltroGeral()">Limpar Filtro</button>
        </div>
        
        <!-- Estatísticas gerais -->
        <div class="estatisticas-gerais" id="estatisticasGerais">
            <div class="loading">Carregando estatísticas...</div>
        </div>
    `;
    
    carregarEstatisticasGerais();
}

// Função para carregar o painel de estatísticas gerais
export async function carregarEstatisticasGerais() {
    const dataInicial = document.getElementById('dataInicialGeral')?.value;
    const dataFinal = document.getElementById('dataFinalGeral')?.value;
    
    // Busca todas as respostas, salas e feedbacks
    Promise.all([
        fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_respostas`).then(r => r.json()),
        fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_salas`).then(r => r.json()),
        fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_all_feedbacks`).then(r => r.json())
    ])
    .then(([respostasJson, salasJson, feedbacksJson]) => {
        // Converte JSON para objetos usando fromJson
        const respostas = Resposta.fromJsonArray(respostasJson);
        const salas = Sala.fromJsonArray(salasJson);
        const feedbacks = feedbacksJson || [];
        
        // Aplica filtro de data se necessário
        let respostasFiltradas = respostas;
        if (dataInicial && dataFinal) {
            respostasFiltradas = respostas.filter(r => {
                const dataResposta = r.getDataISO();
                return dataResposta >= dataInicial && dataResposta <= dataFinal;
            });
        }
        
        // Calcula estatísticas
        const stats = calcularEstatisticasGerais(respostasFiltradas, salas, feedbacks, dataInicial, dataFinal);
        renderizarEstatisticasGerais(stats, dataInicial, dataFinal);
    })
    .catch(error => {
        console.error('Erro ao carregar estatísticas gerais:', error);
        document.getElementById('estatisticasGerais').innerHTML = '<p>Erro ao carregar estatísticas.</p>';
    });
}

// Função para calcular estatísticas gerais com base nas respostas e salas
export function calcularEstatisticasGerais(respostas, salas, feedbacks, dataInicial, dataFinal) {
    const stats = {
        totalAvaliacoes: 0,
        avaliacoesPorSala: {},
        mediaPorSala: {},
        avaliacoesComFeedback: 0,
        periodo: ''
    };
    
    // Inicializa contadores por sala
    salas.forEach(sala => {
        stats.avaliacoesPorSala[sala.id] = { nome: sala.descricao, count: 0 };
        stats.mediaPorSala[sala.id] = { nome: sala.descricao, soma: 0, count: 0, media: 0 };
    });
    
    // Agrupa respostas por id_respostas para contar avaliações únicas
    const avaliacoesUnicas = new Set();
    
    respostas.forEach(r => {
        avaliacoesUnicas.add(r.id_respostas);
        
        // Conta por sala
        if (stats.mediaPorSala[r.sala_id]) {
            stats.mediaPorSala[r.sala_id].soma += parseFloat(r.nota);
            stats.mediaPorSala[r.sala_id].count++;
        }
    });
    
    stats.totalAvaliacoes = avaliacoesUnicas.size;
    
    // Calcula médias
    Object.keys(stats.mediaPorSala).forEach(salaId => {
        const sala = stats.mediaPorSala[salaId];
        if (sala.count > 0) {
            sala.media = (sala.soma / sala.count).toFixed(2);
        }
    });
    
    // Conta avaliações por sala (únicas)
    respostas.forEach(r => {
        if (stats.avaliacoesPorSala[r.sala_id]) {
            if (!stats.avaliacoesPorSala[r.sala_id].ids) {
                stats.avaliacoesPorSala[r.sala_id].ids = new Set();
            }
            stats.avaliacoesPorSala[r.sala_id].ids.add(r.id_respostas);
        }
    });
    
    Object.keys(stats.avaliacoesPorSala).forEach(salaId => {
        const sala = stats.avaliacoesPorSala[salaId];
        sala.count = sala.ids ? sala.ids.size : 0;
    });
    
    // Conta apenas feedbacks das avaliações no período filtrado
    const idsRespostasFiltradas = new Set(respostas.map(r => r.id_respostas));
    
    // Filtra feedbacks que estão nas respostas filtradas
    if (feedbacks && Array.isArray(feedbacks)) {
        const feedbacksFiltrados = feedbacks.filter(f => idsRespostasFiltradas.has(f.id_respostas));
        stats.avaliacoesComFeedback = feedbacksFiltrados.length;
    }
    
    return stats;
}

// Função para renderizar as estatísticas gerais na tela
export function renderizarEstatisticasGerais(stats, dataInicial, dataFinal) {
    const container = document.getElementById('estatisticasGerais');
    if (!container) return;
    
    const periodo = (dataInicial && dataFinal) 
        ? `Período: ${new Date(dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}` 
        : 'Período: Todos os registros';
    
    let html = `
        <div class="periodo-info">${periodo}</div>
        
        <div class="cards-estatisticas">
            <div class="card-stat">
                <div class="card-stat-icon">📊</div>
                <div class="card-stat-info">
                    <div class="card-stat-label">Total de Avaliações</div>
                    <div class="card-stat-value">${stats.totalAvaliacoes}</div>
                </div>
            </div>
            
            <div class="card-stat">
                <div class="card-stat-icon">💬</div>
                <div class="card-stat-info">
                    <div class="card-stat-label">Avaliações com Feedback</div>
                    <div class="card-stat-value">${stats.avaliacoesComFeedback}</div>
                </div>
            </div>
        </div>
        
        <div class="secao-salas">
            <h3>Estatísticas por Sala</h3>
            <div class="tabela-salas-container">
                <table class="tabela-salas">
                    <thead>
                        <tr>
                            <th>Sala</th>
                            <th>Média de Notas</th>
                            <th>Número de Avaliações</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    Object.keys(stats.mediaPorSala).forEach(salaId => {
        const media = stats.mediaPorSala[salaId];
        const avaliacoes = stats.avaliacoesPorSala[salaId];
        const cor = getCorPorMedia(parseFloat(media.media));
        
        html += `
            <tr>
                <td><strong>${media.nome}</strong></td>
                <td>
                    <span class="badge-nota" style="background-color: ${cor}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">
                        ${media.media}
                    </span>
                </td>
                <td>${avaliacoes.count}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Função para aplicar filtro de datas nas estatísticas gerais
export function aplicarFiltroGeral() {
    const dataInicial = document.getElementById('dataInicialGeral').value;
    const dataFinal = document.getElementById('dataFinalGeral').value;
    
    if (!dataInicial || !dataFinal) {
        alert('Por favor, selecione ambas as datas para filtrar.');
        return;
    }
    
    if (dataInicial > dataFinal) {
        alert('A data inicial não pode ser maior que a data final.');
        return;
    }
    
    carregarEstatisticasGerais();
}

// Função para limpar o filtro de datas das estatísticas gerais
export function limparFiltroGeral() {
    document.getElementById('dataInicialGeral').value = '';
    document.getElementById('dataFinalGeral').value = '';
    carregarEstatisticasGerais();
}

// ========================================
// TELA SALAS
// ========================================

// Função para gerar a tela de salas
export function gerarTelaSalas() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Salva o estado da tela
    salvarEstadoTela('salas', {});
    
    mainContent.innerHTML = '<h2>Gestão de Salas</h2>';
    
    // Busca todas as salas
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_salas`)
        .then(response => response.json())
        .then(salasJson => {
            // Converte JSON para objetos usando fromJson
            const salas = Sala.fromJsonArray(salasJson);
            
            const containerBotoes = document.createElement('div');
            containerBotoes.className = 'salas-grid';
            
            salas.forEach(sala => {
                const botaoSala = document.createElement('button');
                botaoSala.className = 'sala-card';
                botaoSala.innerHTML = `
                    <span class="sala-icon">🏠</span>
                    <span class="sala-nome">${sala.descricao}</span>
                `;
                botaoSala.onclick = () => abrirDetalhesSala(sala.id, sala.descricao);
                containerBotoes.appendChild(botaoSala);
            });
            
            // Card para adicionar nova sala
            const cardNovaSala = document.createElement('button');
            cardNovaSala.className = 'sala-card sala-card-novo';
            cardNovaSala.innerHTML = `
                <span class="sala-icon">+</span>
                <span class="sala-nome">Nova Sala</span>
            `;
            cardNovaSala.onclick = () => abrirOverlayNovaSala();
            containerBotoes.appendChild(cardNovaSala);
            
            mainContent.appendChild(containerBotoes);
        })
        .catch(error => {
            console.error('Erro ao obter salas:', error);
            mainContent.innerHTML += '<p>Erro ao carregar as salas.</p>';
        });
}

// Função para abrir os detalhes de uma sala específica
export function abrirDetalhesSala(salaId, salaNome) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Salva o estado da tela
    salvarEstadoTela('detalhesSala', { salaId, salaNome });
    
    mainContent.innerHTML = `
        <div class="sala-header">
            <button class="btn-voltar" onclick="gerarTelaSalas()">← Voltar</button>
            <h2>Detalhes da Sala: ${salaNome}</h2>
            <button class="btn-inativar-sala" onclick="inativarSala(${salaId}, '${salaNome}')" title="Inativar sala">
                🗑️ Inativar Sala
            </button>
        </div>
        
        <!-- Filtro de datas -->
        <div class="filtro-datas">
            <div class="filtro-grupo">
                <label for="dataInicial">Data Inicial:</label>
                <input type="date" id="dataInicial" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="filtro-grupo">
                <label for="dataFinal">Data Final:</label>
                <input type="date" id="dataFinal" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button class="btn-limpar-filtro" onclick="limparFiltroData(${salaId})">Limpar Filtro</button>
        </div>
        
        <!-- Painel de Perguntas -->
        <div class="painel-perguntas-sala" id="painelPerguntasSala">
            <h3>Perguntas da Sala</h3>
            <div class="perguntas-grid" id="perguntasGrid"></div>
        </div>
        
        <!-- Painel de Estatísticas (segundo painel) -->
        <div class="painel-estatisticas-sala" id="painelEstatisticasSala">
            <h3>Estatísticas</h3>
            <div class="estatisticas-conteudo" id="estatisticasConteudo"></div>
        </div>
        
        <!-- Painel de Avaliações (terceiro painel) -->
        <div class="painel-avaliacoes-sala" id="painelAvaliacoesSala">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">Avaliações</h3>
                <button class="btn-recarregar-avaliacoes" onclick="recarregarAvaliacoes(${salaId})" title="Recarregar avaliações">
                    ↻ Recarregar
                </button>
            </div>
            <div class="avaliacoes-conteudo" id="avaliacoesConteudo"></div>
        </div>
    `;
    
    // Carrega as perguntas da sala
    carregarPerguntasDaSala(salaId);
    
    // Carrega as estatísticas da sala
    carregarEstatisticasDaSala(salaId);
    
    // Carrega as avaliações da sala
    carregarAvaliacoesDaSala(salaId);
}

// Função para carregar as perguntas de uma sala
export function carregarPerguntasDaSala(salaId) {
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_perguntas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(perguntasJson => {
            // Converte JSON para objetos usando fromJson
            const perguntas = Pergunta.fromJsonArray(perguntasJson);
            renderizarPerguntasGrid(perguntas, salaId);
        })
        .catch(error => {
            console.error('Erro ao carregar perguntas da sala:', error);
            const grid = document.getElementById('perguntasGrid');
            if (grid) {
                grid.innerHTML = '<p>Erro ao carregar as perguntas.</p>';
            }
        });
}

// Função para renderizar o grid de perguntas da sala
export function renderizarPerguntasGrid(perguntas, salaId) {
    const grid = document.getElementById('perguntasGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (perguntas.length === 0) {
        grid.innerHTML = '<p>Nenhuma pergunta encontrada para esta sala.</p>';
    } else {
        perguntas.forEach(pergunta => {
            const card = document.createElement('div');
            card.className = 'pergunta-card';
            card.draggable = true;
            card.dataset.perguntaId = pergunta.id;
            card.dataset.ordemExibicao = pergunta.ordem_exibicao;
            card.innerHTML = `
                <div class="pergunta-id">#${pergunta.ordem_exibicao}</div>
                <div class="pergunta-descricao">${pergunta.descricao}</div>
            `;
            
            // Evento de clique (apenas quando não está arrastando)
            card.addEventListener('click', (e) => {
                if (!card.classList.contains('dragging')) {
                    abrirOverlayPergunta(pergunta);
                }
            });
            
            // Eventos de drag and drop
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragleave', handleDragLeave);
            
            grid.appendChild(card);
        });
    }
    
    // Card para adicionar nova pergunta
    const cardNovo = document.createElement('div');
    cardNovo.className = 'pergunta-card pergunta-card-novo';
    cardNovo.innerHTML = `
        <div class="pergunta-add-icon">+</div>
        <div class="pergunta-add-texto">Nova Pergunta</div>
    `;
    cardNovo.onclick = () => abrirOverlayNovaPergunta(salaId);
    grid.appendChild(cardNovo);
    
    // Adiciona botão de salvar ordem (se não existir)
    const painelPerguntas = document.getElementById('painelPerguntasSala');
    if (painelPerguntas && !document.getElementById('btnSalvarOrdem')) {
        const btnSalvar = document.createElement('button');
        btnSalvar.id = 'btnSalvarOrdem';
        btnSalvar.className = 'btn-salvar-ordem';
        btnSalvar.textContent = '💾 Salvar Nova Ordem';
        btnSalvar.onclick = () => salvarOrdemPerguntas(salaId);
        painelPerguntas.appendChild(btnSalvar);
    }
}

// Função para aplicar filtro de datas nas estatísticas da sala
export function aplicarFiltroData(salaId) {
    const dataInicial = document.getElementById('dataInicial').value;
    const dataFinal = document.getElementById('dataFinal').value;
    
    if (!dataInicial || !dataFinal) {
        alert('Por favor, selecione ambas as datas para filtrar.');
        return;
    }
    
    if (dataInicial > dataFinal) {
        alert('A data inicial não pode ser maior que a data final.');
        return;
    }
    
    console.log(`Filtrando dados da sala ${salaId} de ${dataInicial} até ${dataFinal}`);
    // Aqui você pode adicionar lógica para filtrar estatísticas por data
    // Por exemplo, recarregar as estatísticas com os parâmetros de data
}

// Função para limpar o filtro de datas da sala
export function limparFiltroData(salaId) {
    document.getElementById('dataInicial').value = '';
    document.getElementById('dataFinal').value = '';
    console.log(`Filtro de data limpo para sala ${salaId}`);
    // Recarrega os dados sem filtro
}

// Função para recarregar as avaliações da sala
export function recarregarAvaliacoes(salaId) {
    console.log(`Recarregando avaliações da sala ${salaId}`);
    carregarAvaliacoesDaSala(salaId);
}

// Função para abrir o overlay de criação de nova sala
export function abrirOverlayNovaSala() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-pergunta';
    overlay.innerHTML = `
        <div class="overlay-conteudo">
            <div class="overlay-header">
                <h3>Nova Sala</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayNovaSala()">&times;</button>
            </div>
            <div class="overlay-body">
                <label for="nomeNovaSala">Nome da Sala:</label>
                <input type="text" id="nomeNovaSala" class="input-nome-sala" placeholder="Digite o nome da sala..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1em;">
            </div>
            <div class="overlay-footer">
                <button class="btn-salvar" onclick="criarNovaSala()">💾 Criar Sala</button>
                <button class="btn-cancelar" onclick="fecharOverlayNovaSala()">❌ Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Foca no input
    setTimeout(() => {
        const input = document.getElementById('nomeNovaSala');
        input.focus();
        // Permite criar ao pressionar Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                criarNovaSala();
            }
        });
    }, 100);
}

// Função para fechar o overlay de nova sala
export function fecharOverlayNovaSala() {
    const overlay = document.querySelector('.overlay-pergunta');
    if (overlay) {
        overlay.remove();
    }
}

// Função para criar uma nova sala
export function criarNovaSala() {
    const input = document.getElementById('nomeNovaSala');
    const nomeSala = input.value.trim();
    
    if (!nomeSala) {
        alert('O nome da sala não pode estar vazio.');
        return;
    }
    
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=criar_sala`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            descricao: nomeSala
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Sala criada com sucesso!');
            fecharOverlayNovaSala();
            // Recarrega a tela de salas
            gerarTelaSalas();
        } else {
            alert('Erro ao criar sala: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala.');
    });
}

// Função para inativar uma sala
export function inativarSala(salaId, salaNome) {
    if (!confirm(`Tem certeza que deseja inativar a sala "${salaNome}"? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=inativar_sala`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: salaId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Sala inativada com sucesso!');
            // Volta para a tela de salas
            gerarTelaSalas();
        } else {
            alert('Erro ao inativar sala: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao inativar sala:', error);
        alert('Erro ao inativar sala.');
    });
}

// ========================================
// ESTATÍSTICAS DA SALA
// ========================================

// Função para carregar as estatísticas de uma sala específica
export function carregarEstatisticasDaSala(salaId) {
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_perguntas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(perguntasJson => {
            // Converte JSON para objetos usando fromJson
            const perguntas = Pergunta.fromJsonArray(perguntasJson);
            renderizarEstatisticasGrid(perguntas);
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas da sala:', error);
            const conteudo = document.getElementById('estatisticasConteudo');
            if (conteudo) {
                conteudo.innerHTML = '<p>Erro ao carregar as estatísticas.</p>';
            }
        });
}

// Função para renderizar o grid de estatísticas das perguntas
export function renderizarEstatisticasGrid(perguntas) {
    const conteudo = document.getElementById('estatisticasConteudo');
    if (!conteudo) return;
    
    conteudo.innerHTML = '';
    
    if (perguntas.length === 0) {
        conteudo.innerHTML = '<p>Nenhuma pergunta encontrada para gerar estatísticas.</p>';
        return;
    }
    
    // Cria grid de perguntas para estatísticas
    const grid = document.createElement('div');
    grid.className = 'perguntas-grid';
    grid.id = 'estatisticasGrid';
    
    perguntas.forEach(pergunta => {
        const card = document.createElement('div');
        card.className = 'pergunta-card estatistica-card';
        card.innerHTML = `
            <div class="pergunta-id">#${pergunta.ordem_exibicao}</div>
            <div class="pergunta-descricao">${pergunta.descricao}</div>
        `;
        card.onclick = () => abrirGraficoPergunta(pergunta.id, pergunta.descricao);
        grid.appendChild(card);
    });
    
    conteudo.appendChild(grid);
}

// Função para abrir o gráfico de pizza de uma pergunta específica
export function abrirGraficoPergunta(perguntaId, perguntaDescricao) {
    // Obtém os valores do filtro de data
    const dataInicial = document.getElementById('dataInicial')?.value;
    const dataFinal = document.getElementById('dataFinal')?.value;
    
    // Busca as respostas da pergunta
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_respostas_por_pergunta&pergunta_id=${perguntaId}`)
        .then(response => response.json())
        .then(respostasJson => {
            // Converte JSON para objetos usando fromJson
            const respostas = Resposta.fromJsonArray(respostasJson);
            
            if (respostas.length === 0) {
                alert('Nenhuma resposta encontrada para esta pergunta.');
                return;
            }
            
            // Aplica o filtro de data se ambas as datas estiverem preenchidas
            let respostasFiltradas = respostas;
            if (dataInicial && dataFinal) {
                respostasFiltradas = respostas.filter(resposta => {
                    const dataResposta = resposta.getDataISO();
                    return dataResposta >= dataInicial && dataResposta <= dataFinal;
                });
                
                if (respostasFiltradas.length === 0) {
                    alert('Nenhuma resposta encontrada no período selecionado.');
                    return;
                }
            }
            
            // Processa as notas e gera o gráfico
            gerarGraficoPizza(perguntaId, perguntaDescricao, respostasFiltradas, dataInicial, dataFinal);
        })
        .catch(error => {
            console.error('Erro ao buscar respostas:', error);
            alert('Erro ao carregar dados para o gráfico.');
        });
}

// Função para gerar o gráfico de pizza
export function gerarGraficoPizza(perguntaId, perguntaDescricao, respostas, dataInicial, dataFinal) {
    // Conta as ocorrências de cada nota (0-10)
    const contagemNotas = {};
    for (let i = 0; i <= 10; i++) {
        contagemNotas[i] = 0;
    }
    
    respostas.forEach(resposta => {
        const nota = parseInt(resposta.nota);
        if (nota >= 0 && nota <= 10) {
            contagemNotas[nota]++;
        }
    });
    
    // Remove notas com contagem zero
    const dadosGrafico = [];
    for (let nota in contagemNotas) {
        if (contagemNotas[nota] > 0) {
            dadosGrafico.push({
                nota: parseInt(nota),
                quantidade: contagemNotas[nota],
                percentual: ((contagemNotas[nota] / respostas.length) * 100).toFixed(1)
            });
        }
    }
    
    // Cria o overlay com o gráfico
    criarOverlayGrafico(perguntaId, perguntaDescricao, dadosGrafico, respostas.length, dataInicial, dataFinal);
}

// Função para criar o overlay visual com o gráfico de pizza
export function criarOverlayGrafico(perguntaId, perguntaDescricao, dadosGrafico, totalRespostas, dataInicial, dataFinal) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-grafico';
    
    // Cores conforme a escala da imagem (Improvável 0 -> Muito Provável 10)
    const coresCompletas = [
        '#FF0000', // 0 - Vermelho (Improvável)
        '#CC0000', // 1 - Vermelho escuro
        '#FF4500', // 2 - Laranja avermelhado
        '#FF8C00', // 3 - Laranja
        '#FFA500', // 4 - Laranja claro
        '#FFD700', // 5 - Amarelo ouro
        '#FFFF00', // 6 - Amarelo
        '#ADFF2F', // 7 - Verde amarelado
        '#9ACD32', // 8 - Verde claro
        '#7CFC00', // 9 - Verde
        '#32CD32'  // 10 - Verde (Muito Provável)
    ];
    
    // Texto do período filtrado
    let periodoTexto = '';
    if (dataInicial && dataFinal) {
        const dataInicialFormatada = new Date(dataInicial + 'T00:00:00').toLocaleDateString('pt-BR');
        const dataFinalFormatada = new Date(dataFinal + 'T00:00:00').toLocaleDateString('pt-BR');
        periodoTexto = `<p class="grafico-periodo">Período: ${dataInicialFormatada} a ${dataFinalFormatada}</p>`;
    }
    
    // Gera um ID único para o canvas
    const canvasId = `chartCanvas_${perguntaId}_${Date.now()}`;
    
    overlay.innerHTML = `
        <div class="overlay-grafico-conteudo">
            <div class="overlay-grafico-header">
                <h3>Estatísticas - Pergunta #${perguntaId}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayGrafico()">&times;</button>
            </div>
            <div class="overlay-grafico-body">
                <p class="grafico-descricao">${perguntaDescricao}</p>
                ${periodoTexto}
                <p class="grafico-total">Total de respostas: <strong>${totalRespostas}</strong></p>
                
                <div class="grafico-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Aguarda um momento para o DOM estar pronto
    setTimeout(() => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        // Prepara os dados para o Chart.js
        const labels = dadosGrafico.map(item => `Nota ${item.nota}`);
        const data = dadosGrafico.map(item => item.quantidade);
        const backgroundColors = dadosGrafico.map(item => coresCompletas[item.nota]);
        
        // Cria o gráfico com Chart.js
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const percentage = ((value / totalRespostas) * 100).toFixed(1);
                                        return {
                                            text: `${label}: ${value} (${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / totalRespostas) * 100).toFixed(1);
                                return `${label}: ${value} respostas (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }, 100);
}

// Função para fechar o overlay do gráfico
export function fecharOverlayGrafico() {
    const overlay = document.querySelector('.overlay-grafico');
    if (overlay) {
        overlay.remove();
    }
}

// ========================================
// AVALIAÇÕES DA SALA
// ========================================

// Função para carregar as avaliações de uma sala específica
export function carregarAvaliacoesDaSala(salaId) {
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_respostas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(respostasJson => {
            // Converte JSON para objetos usando fromJson
            const respostas = Resposta.fromJsonArray(respostasJson);
            
            if (respostas.length === 0) {
                document.getElementById('avaliacoesConteudo').innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
                return;
            }
            
            // Obtém os valores do filtro de data
            const dataInicial = document.getElementById('dataInicial')?.value;
            const dataFinal = document.getElementById('dataFinal')?.value;
            
            // Aplica o filtro de data se ambas as datas estiverem preenchidas
            let respostasFiltradas = respostas;
            if (dataInicial && dataFinal) {
                respostasFiltradas = respostas.filter(resposta => {
                    const dataResposta = resposta.getDataISO();
                    return dataResposta >= dataInicial && dataResposta <= dataFinal;
                });
                
                if (respostasFiltradas.length === 0) {
                    document.getElementById('avaliacoesConteudo').innerHTML = '<p>Nenhuma avaliação encontrada no período selecionado.</p>';
                    return;
                }
            }
            
            // Agrupa respostas por id_respostas usando o método do modelo Avaliacao
            const respostasAgrupadas = Avaliacao.agruparRespostasPorAvaliacao(respostasFiltradas);
            
            renderizarAvaliacoesGrid(respostasAgrupadas);
        })
        .catch(error => {
            console.error('Erro ao carregar avaliações:', error);
            document.getElementById('avaliacoesConteudo').innerHTML = '<p>Erro ao carregar avaliações.</p>';
        });
}

// Função para renderizar o grid de avaliações da sala
export function renderizarAvaliacoesGrid(avaliacoes) {
    const conteudo = document.getElementById('avaliacoesConteudo');
    if (!conteudo) return;
    
    conteudo.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'avaliacoes-grid';
    
    let numeroAvaliacao = 1;
    for (let idAvaliacao in avaliacoes) {
        const respostas = avaliacoes[idAvaliacao];
        
        // Calcula a média
        const somaNotas = respostas.reduce((sum, r) => sum + parseInt(r.nota), 0);
        const media = (somaNotas / respostas.length).toFixed(1);
        
        // Define a cor baseada na média
        const corMedia = getCorPorMedia(parseFloat(media));
        
        const card = document.createElement('div');
        card.className = 'avaliacao-card';
        card.style.borderColor = corMedia;
        card.innerHTML = `
            <div class="avaliacao-header" style="background-color: ${corMedia}">
                <span class="avaliacao-numero">Avaliação ${numeroAvaliacao}</span>
            </div>
            <div class="avaliacao-body">
                <div class="avaliacao-media">Média: <strong>${media}</strong></div>
                <div class="avaliacao-data">${new Date(respostas[0].data_hora).toLocaleString('pt-BR')}</div>
            </div>
        `;
        card.onclick = () => abrirDetalhesAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media);
        grid.appendChild(card);
        numeroAvaliacao++;
    }
    
    conteudo.appendChild(grid);
}

// Função para obter a cor correspondente a média da avaliação
export function getCorPorMedia(media) {
    // Cores conforme a escala da imagem (0 = vermelho, 10 = verde)
    if (media <= 1) return '#FF0000'; // 0-1: Vermelho
    if (media <= 2) return '#FF4500'; // 2: Laranja avermelhado
    if (media <= 3) return '#FF8C00'; // 3: Laranja
    if (media <= 4) return '#FFA500'; // 4: Laranja claro
    if (media <= 5) return '#FFD700'; // 5: Amarelo ouro
    if (media <= 6) return '#FFFF00'; // 6: Amarelo
    if (media <= 7) return '#ADFF2F'; // 7: Verde amarelado
    if (media <= 8) return '#9ACD32'; // 8: Verde claro
    if (media <= 9) return '#7CFC00'; // 9: Verde
    return '#32CD32'; // 10: Verde
}

// Função para exibir os detalhes de uma avaliação
export function abrirDetalhesAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media) {
    // Busca o feedback se existir
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=get_feedback&id_respostas=${idAvaliacao}`)
        .then(response => response.json())
        .then(feedbackJson => {
            // Converte JSON para objeto usando fromJson
            const feedback = Feedback.fromJson(feedbackJson);
            mostrarOverlayAvaliacao(numeroAvaliacao, respostas, media, feedback);
        })
        .catch(error => {
            console.error('Erro ao buscar feedback:', error);
            mostrarOverlayAvaliacao(numeroAvaliacao, respostas, media, null);
        });
}

// Função para mostrar o overlay com os detalhes completos da avaliação
export function mostrarOverlayAvaliacao(numeroAvaliacao, respostas, media, feedback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-avaliacao';
    
    const corMedia = getCorPorMedia(parseFloat(media));
    
    // Organiza respostas por pergunta
    let respostasHTML = '';
    respostas.forEach(resposta => {
        const ordemExibicao = resposta.perguntaOrdem || resposta.perguntaId;
        const descricao = resposta.perguntaDescricao || 'Descrição não disponível';
        respostasHTML += `
            <div class="resposta-item" onclick="toggleDescricaoPergunta(this)" style="cursor: pointer;" title="Clique para ver a descrição da pergunta">
                <span class="resposta-pergunta">Pergunta #${ordemExibicao}</span>
                <div class="resposta-descricao" style="display: none; margin-top: 8px; padding: 8px; background-color: #f5f5f5; border-radius: 4px; font-size: 0.9em; color: #555;">
                    ${descricao}
                </div>
                <span class="resposta-nota" style="background-color: ${getCorPorMedia(resposta.nota)}">
                    Nota: ${resposta.nota}
                </span>
            </div>
        `;
    });
    
    // Feedback
    let feedbackHTML = '';
    if (feedback && feedback.hasDescricao()) {
        feedbackHTML = `
            <div class="avaliacao-feedback">
                <h4>Feedback do Cliente</h4>
                <p>${feedback.descricao}</p>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div class="overlay-avaliacao-conteudo">
            <div class="overlay-avaliacao-header" style="background-color: ${corMedia}">
                <h3>Avaliação ${numeroAvaliacao}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayAvaliacao()">&times;</button>
            </div>
            <div class="overlay-avaliacao-body">
                <div class="avaliacao-info">
                    <p class="avaliacao-media-destaque">Média: <strong style="color: ${corMedia}">${media}</strong></p>
                    <p class="avaliacao-data-completa">${respostas[0].getDataFormatada()}</p>
                </div>
                
                ${feedbackHTML}
                
                <div class="avaliacao-respostas">
                    <h4>Todas as Respostas</h4>
                    ${respostasHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Função para fechar o overlay de detalhes da avaliação
export function fecharOverlayAvaliacao() {
    const overlay = document.querySelector('.overlay-avaliacao');
    if (overlay) {
        overlay.remove();
    }
}

// Função para exibir a descrição da pergunta ao clicar
export function toggleDescricaoPergunta(element) {
    const descricaoDiv = element.querySelector('.resposta-descricao');
    if (descricaoDiv) {
        if (descricaoDiv.style.display === 'none') {
            descricaoDiv.style.display = 'block';
        } else {
            descricaoDiv.style.display = 'none';
        }
    }
}

// Função para recarregar apenas as perguntas da sala atual
export function recarregarPerguntasSala() {
    const estado = localStorage.getItem('estadoTela');
    
    if (estado) {
        try {
            const { tipo, dados } = JSON.parse(estado);
            
            if (tipo === 'detalhesSala' && dados.salaId) {
                // Recarrega apenas as perguntas sem mudar o estado
                carregarPerguntasDaSala(dados.salaId);
            }
        } catch (error) {
            console.error('Erro ao recarregar perguntas da sala:', error);
        }
    }
}

// ========================================
// OVERLAY DE PERGUNTA
// ========================================

// Função para abrir o overlay de visualização/edição de pergunta
export function abrirOverlayPergunta(pergunta) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-pergunta';
    overlay.innerHTML = `
        <div class="overlay-conteudo">
            <div class="overlay-header">
                <h3>Pergunta #${pergunta.id}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayPergunta()">&times;</button>
            </div>
            <div class="overlay-body">
                <label for="descricaoPergunta">Descrição:</label>
                <textarea id="descricaoPergunta" class="textarea-descricao" readonly>${pergunta.descricao}</textarea>
            </div>
            <div class="overlay-footer">
                <button class="btn-editar" onclick="habilitarEdicaoPergunta(${pergunta.id})">✏️ Editar</button>
                <button class="btn-salvar" id="btnSalvarPergunta" style="display: none;" onclick="salvarEdicaoPergunta(${pergunta.id})">💾 Salvar</button>
                <button class="btn-cancelar" id="btnCancelarPergunta" style="display: none;" onclick="cancelarEdicaoPergunta('${pergunta.descricao}')">❌ Cancelar</button>
                <button class="btn-excluir" onclick="excluirPergunta(${pergunta.id})">🗑️ Excluir</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Função para fechar o overlay de pergunta
export function fecharOverlayPergunta() {
    const overlay = document.querySelector('.overlay-pergunta');
    if (overlay) {
        overlay.remove();
    }
}

// Função para habilitar o modo de edição da pergunta
export function habilitarEdicaoPergunta() {
    const textarea = document.getElementById('descricaoPergunta');
    const btnEditar = document.querySelector('.btn-editar');
    const btnSalvar = document.getElementById('btnSalvarPergunta');
    const btnCancelar = document.getElementById('btnCancelarPergunta');
    
    textarea.readOnly = false;
    textarea.focus();
    btnEditar.style.display = 'none';
    btnSalvar.style.display = 'inline-block';
    btnCancelar.style.display = 'inline-block';
}

// Função para cancelar a edição e restaurar o texto original
export function cancelarEdicaoPergunta(descricaoOriginal) {
    const textarea = document.getElementById('descricaoPergunta');
    const btnEditar = document.querySelector('.btn-editar');
    const btnSalvar = document.getElementById('btnSalvarPergunta');
    const btnCancelar = document.getElementById('btnCancelarPergunta');
    
    textarea.value = descricaoOriginal;
    textarea.readOnly = true;
    btnEditar.style.display = 'inline-block';
    btnSalvar.style.display = 'none';
    btnCancelar.style.display = 'none';
}

// Função para salvar as alterações feitas na pergunta
export function salvarEdicaoPergunta(perguntaId) {
    const textarea = document.getElementById('descricaoPergunta');
    const novaDescricao = textarea.value.trim();
    
    if (!novaDescricao) {
        alert('A descrição da pergunta não pode estar vazia.');
        return;
    }
    
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=editar_pergunta`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: perguntaId,
            descricao: novaDescricao
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta atualizada com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao atualizar pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao salvar pergunta:', error);
        alert('Erro ao salvar pergunta.');
    });
}

// Função para inativar uma pergunta
export function excluirPergunta(perguntaId) {
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=excluir_pergunta`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: perguntaId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta excluída com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao excluir pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao excluir pergunta:', error);
        alert('Erro ao excluir pergunta.');
    });
}

// Função para abrir o overlay de criação de nova pergunta
export function abrirOverlayNovaPergunta(salaId) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-pergunta';
    overlay.innerHTML = `
        <div class="overlay-conteudo">
            <div class="overlay-header">
                <h3>Nova Pergunta</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayPergunta()">&times;</button>
            </div>
            <div class="overlay-body">
                <label for="descricaoNovaPergunta">Descrição:</label>
                <textarea id="descricaoNovaPergunta" class="textarea-descricao" placeholder="Digite a descrição da pergunta..."></textarea>
            </div>
            <div class="overlay-footer">
                <button class="btn-salvar" onclick="criarNovaPergunta(${salaId})">💾 Criar Pergunta</button>
                <button class="btn-cancelar" onclick="fecharOverlayPergunta()">❌ Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Foca no textarea
    setTimeout(() => {
        document.getElementById('descricaoNovaPergunta').focus();
    }, 100);
}

// Função para criar uma nova pergunta na sala
export function criarNovaPergunta(salaId) {
    const textarea = document.getElementById('descricaoNovaPergunta');
    const descricao = textarea.value.trim();
    
    if (!descricao) {
        alert('A descrição da pergunta não pode estar vazia.');
        return;
    }
    
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=criar_pergunta`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sala_id: salaId,
            descricao: descricao
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta criada com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao criar pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao criar pergunta:', error);
        alert('Erro ao criar pergunta.');
    });
}

// ========================================
// DRAG AND DROP PARA REORDENAR PERGUNTAS
// ========================================

let draggedElement = null;

// Função para iniciar o arraste de um card de pergunta
export function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

// Função para finalizar o arraste e mostrar botão de salvar
export function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove classe drag-over de todos os cards
    document.querySelectorAll('.pergunta-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    // Mostra o botão de salvar ordem
    const btnSalvar = document.getElementById('btnSalvarOrdem');
    if (btnSalvar) {
        btnSalvar.classList.add('show');
    }
}

// Função para permitir que o elemento seja solto sobre outro
export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    // Não permite soltar sobre o card de nova pergunta
    if (this.classList.contains('pergunta-card-novo')) {
        return false;
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Função para processar o drop e reordenar os cards
export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Não permite soltar sobre o card de nova pergunta
    if (this.classList.contains('pergunta-card-novo')) {
        return false;
    }
    
    if (draggedElement !== this) {
        // Obtém o grid
        const grid = this.parentNode;
        
        // Obtém a posição de ambos os elementos
        const allCards = [...grid.querySelectorAll('.pergunta-card:not(.pergunta-card-novo)')];
        const draggedIndex = allCards.indexOf(draggedElement);
        const targetIndex = allCards.indexOf(this);
        
        // Move o elemento
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
        
        // Atualiza os números de ordem visualmente
        atualizarNumerosOrdem();
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Função para remover o feedback visual ao sair da área de drop
export function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// Função para atualizar os números de ordem visualmente após reordenação
export function atualizarNumerosOrdem() {
    const grid = document.getElementById('perguntasGrid');
    if (!grid) return;
    
    const cards = grid.querySelectorAll('.pergunta-card:not(.pergunta-card-novo)');
    cards.forEach((card, index) => {
        const perguntaIdElement = card.querySelector('.pergunta-id');
        if (perguntaIdElement) {
            perguntaIdElement.textContent = `#${index + 1}`;
            card.dataset.novaOrdem = index + 1;
        }
    });
}

// Função para salvar a nova ordem das perguntas no banco de dados
export function salvarOrdemPerguntas(salaId) {
    const grid = document.getElementById('perguntasGrid');
    if (!grid) return;
    
    const cards = grid.querySelectorAll('.pergunta-card:not(.pergunta-card-novo)');
    const perguntas = [];
    
    cards.forEach((card, index) => {
        perguntas.push({
            id: parseInt(card.dataset.perguntaId),
            ordem_exibicao: index + 1
        });
    });
    
    if (perguntas.length === 0) {
        alert('Nenhuma pergunta para atualizar.');
        return;
    }
    
    // Envia para o backend
    fetch(`${http}/progavaliacoescafe/src/backend.php?action=atualizar_ordem_perguntas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ perguntas })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Ordem das perguntas atualizada com sucesso!');
            
            // Esconde o botão de salvar
            const btnSalvar = document.getElementById('btnSalvarOrdem');
            if (btnSalvar) {
                btnSalvar.classList.remove('show');
            }
            
            // Recarrega as perguntas
            carregarPerguntasDaSala(salaId);
            carregarEstatisticasDaSala(salaId);
        } else {
            alert('Erro ao atualizar ordem: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao salvar ordem:', error);
        alert('Erro ao salvar ordem das perguntas.');
    });
}

// ========================================
// EXPORTAÇÕES PARA USO GLOBAL
// ========================================

window.gerarTelaGeral = gerarTelaGeral;
window.carregarEstatisticasGerais = carregarEstatisticasGerais;
window.calcularEstatisticasGerais = calcularEstatisticasGerais;
window.renderizarEstatisticasGerais = renderizarEstatisticasGerais;
window.aplicarFiltroGeral = aplicarFiltroGeral;
window.limparFiltroGeral = limparFiltroGeral;
window.gerarTelaSalas = gerarTelaSalas;
window.abrirDetalhesSala = abrirDetalhesSala;
window.carregarPerguntasDaSala = carregarPerguntasDaSala;
window.renderizarPerguntasGrid = renderizarPerguntasGrid;
window.aplicarFiltroData = aplicarFiltroData;
window.limparFiltroData = limparFiltroData;
window.recarregarAvaliacoes = recarregarAvaliacoes;
window.carregarEstatisticasDaSala = carregarEstatisticasDaSala;
window.renderizarEstatisticasGrid = renderizarEstatisticasGrid;
window.abrirGraficoPergunta = abrirGraficoPergunta;
window.gerarGraficoPizza = gerarGraficoPizza;
window.criarOverlayGrafico = criarOverlayGrafico;
window.fecharOverlayGrafico = fecharOverlayGrafico;
window.carregarAvaliacoesDaSala = carregarAvaliacoesDaSala;
window.renderizarAvaliacoesGrid = renderizarAvaliacoesGrid;
window.getCorPorMedia = getCorPorMedia;
window.abrirDetalhesAvaliacao = abrirDetalhesAvaliacao;
window.mostrarOverlayAvaliacao = mostrarOverlayAvaliacao;
window.fecharOverlayAvaliacao = fecharOverlayAvaliacao;
window.toggleDescricaoPergunta = toggleDescricaoPergunta;
window.recarregarPerguntasSala = recarregarPerguntasSala;
window.abrirOverlayPergunta = abrirOverlayPergunta;
window.fecharOverlayPergunta = fecharOverlayPergunta;
window.habilitarEdicaoPergunta = habilitarEdicaoPergunta;
window.cancelarEdicaoPergunta = cancelarEdicaoPergunta;
window.salvarEdicaoPergunta = salvarEdicaoPergunta;
window.excluirPergunta = excluirPergunta;
window.abrirOverlayNovaPergunta = abrirOverlayNovaPergunta;
window.criarNovaPergunta = criarNovaPergunta;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.handleDragLeave = handleDragLeave;
window.atualizarNumerosOrdem = atualizarNumerosOrdem;
window.salvarOrdemPerguntas = salvarOrdemPerguntas;
window.abrirOverlayNovaSala = abrirOverlayNovaSala;
window.fecharOverlayNovaSala = fecharOverlayNovaSala;
window.criarNovaSala = criarNovaSala;
window.inativarSala = inativarSala;
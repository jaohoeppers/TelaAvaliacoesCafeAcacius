//Verificações ao chamar o script

// verifica se está na página de seleção de salas
if(document.getElementById('salas') != null){
    get_salas();
}

// verifica se está na página de avaliação
if(document.getElementById('form_avaliacao') != null){
    h1 = document.getElementById('nome_sala');
    h1.innerHTML = "Avalie a Sala "+getCookie('sala_nome');
    // carregar_perguntas( getCookie('sala_id'));
}

//Realiza a busca das opçoes de salas disponíveis
function get_salas(){
    try{
        fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_salas`)
            .then(response => response.json())
            .then(data => {
                opcoes = document.getElementById('salas');
                data.forEach(sala => {
                    const option = document.createElement('option');
                    option.className = 'sala';
                    option.value = sala.id;
                    option.innerHTML = sala.descricao;
                    opcoes.appendChild(option);
                });
            }
        );
    }
    catch(e){
        console.log('DEU PAU: ',e)
    }
}

//Muda o conteudo da tela para as perguntas, inativa a section antiga e ativa a nova
function gerar_tela_perguntas(){
    document.getElementById('aviso').innerHTML = "Sua opinião é importante — escolha um número de 0 (Improvável) a 10 (Muito provável)."
    document.getElementById('iniciar').style.display = 'none';
    document.querySelector('.avaliacao').style.display = 'block';
    carregar_perguntas( getCookie('sala_id'));
}

//Adiciona as perguntas dentro da section
function carregar_perguntas(salaId) {
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_perguntas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(data => {
            const listaPerguntas = document.getElementById('perguntas');
            listaPerguntas.innerHTML = '';
            data.forEach(pergunta => {
                const fieldset = document.createElement('fieldset');
                fieldset.className = 'pergunta';
                fieldset.id = pergunta.id;
                fieldset.dataset.perguntaId = pergunta.id;

                let html = `
                        <h3>${pergunta.descricao}</h3>
                        <legend class="sr-only">Escolha uma nota de 0 a 10</legend>
                        <div class="rating_scale" role="radiogroup" aria-label="Escala de avaliação 0 a 10">
                    `;

                for (let i = 0; i <= 10; i++) {
                    const inputId = `p${pergunta.id}_r${i}`;
                    html += `
                        <input type="radio" id="${inputId}" name="${pergunta.id}" value="${i}">
                        <label for="${inputId}" class="rating value-${i}">${i}</label>
                    `;
                }

                html += `</div>`;
                fieldset.innerHTML = html;
                listaPerguntas.appendChild(fieldset);
            });

            listaPerguntas.addEventListener('change', function(e) {
                if (e.target.type === 'radio') {
                    const perguntaAtual = e.target.closest('.pergunta');
                    const proximaPergunta = perguntaAtual.nextElementSibling;

                    if (proximaPergunta) {
                        proximaPergunta.classList.add('highlight-animation');
                        
                        rolagemSuave(proximaPergunta, 800);

                        setTimeout(() => {
                            proximaPergunta.classList.remove('highlight-animation');
                        }, 1500);
                    }
                }
            });
        });
}

// Função para rolar a página suavemente até um elemento
function rolagemSuave(elemento, duracao) {
    const posicaoFinal = elemento.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + (elemento.clientHeight / 2);
    const posicaoInicial = window.pageYOffset;
    const distancia = posicaoFinal - posicaoInicial;
    let tempoInicial = null;

    function animacao(tempoAtual) {
        if (tempoInicial === null) tempoInicial = tempoAtual;
        const tempoDecorrido = tempoAtual - tempoInicial;
        
        const t = tempoDecorrido / duracao;
        const progresso = t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        
        const novaPosicao = posicaoInicial + distancia * progresso;
        window.scrollTo(0, novaPosicao);

        if (tempoDecorrido < duracao) {
            requestAnimationFrame(animacao);
        }
    }

    requestAnimationFrame(animacao);
}

// Salvar avaliações no BD
function salvar_respostas() {
    const jsonRespostas = [];
    const respostas = document.forms['form_avaliacao'].querySelectorAll('.pergunta');
    const salaId = getCookie('sala_id');
    let todasRespondidas = true;

    // Ver se todas as perguntas foram respondidas
    respostas.forEach(resposta => {
        const notaSelecionada = resposta.querySelector('input[type="radio"]:checked');

        if (!notaSelecionada) {
            todasRespondidas = false;
            resposta.classList.add('error');
        } else {
            resposta.classList.remove('error');
        }
    });

    if (!todasRespondidas) {
        alert('Por favor, responda todas as perguntas antes de salvar.');
        // Rola para a primeira pergunta não respondida
        const firstError = document.querySelector('.pergunta.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    respostas.forEach((resposta) => {
        const notaSelecionada = resposta.querySelector('input[type="radio"]:checked');
        if (notaSelecionada) {
            jsonRespostas.push({
                pergunta_id: Number(notaSelecionada.name),
                sala_id: Number(salaId),
                nota: Number(notaSelecionada.value),
                data_hora: new Date().toISOString()
            });
        };
    });

    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=salvar_respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonRespostas)
    })
    .then(response => response.json())
    .then(result => {
        agradecimento();
    });
}

function agradecimento(){
    if (document.getElementById('agradecimento_overlay')) return;

    const totalSeconds = 10;
    let elapsed = 0;
    const stepMs = 100;

    // Cria a caixa de agradecimento
    const overlay = document.createElement('div');
    overlay.id = 'agradecimento_overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        zIndex: '99999',
        padding: '20px'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        width: '100%',
        maxWidth: '520px',
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
    });

    box.innerHTML = `
        <header class="agradecimento_header">
            <p class="agradecimento_aviso">Muito obrigado por sua avaliação!</p>
        </header>
        <section class="agradecimento_section">
            <p>O café Acacius agradece por sua avaliação!</p>
            <p>Sua avaliação nos ajuda a sempre buscar por melhorias para oferecer a melhor experiência possível.</p>
        </section>
        <div id="countdown_container">
            <p>Você será redirecionado em <strong id="countdown_timer">10 s</strong>.</p>
            <div id="progress_bar_outer" role="progressbar" aria-valuemin="0" aria-valuemax="${totalSeconds}" aria-valuenow="0">
                <div id="progress_bar_inner"></div>
            </div>
        </div>
        <div class="agradecimento_footer">
            <small>Obrigado por ajudar a melhorar o espaço.</small>
        </div>
        <div id="agradecimento_buttons">
            <button type="button" id="voltar_agora_btn" class="btn_enviar">Voltar agora</button>
        </div>
    `;

    const countdownContainer = box.querySelector('#countdown_container');
    const progressBarOuter = box.querySelector('#progress_bar_outer');
    const progressBarInner = box.querySelector('#progress_bar_inner');
    const buttonsContainer = box.querySelector('#agradecimento_buttons');
    const voltarBtn = box.querySelector('#voltar_agora_btn');
    const countdown = box.querySelector('#countdown_timer');

    Object.assign(countdownContainer.style, { margin: '16px 0' });
    Object.assign(progressBarOuter.style, { width: '100%', height: '14px', background: '#eee', borderRadius: '999px', overflow: 'hidden', marginBottom: '18px' });
    Object.assign(progressBarInner.style, { height: '100%', width: '0%', background: '#4caf50', transition: `width ${stepMs}ms linear` });
    Object.assign(buttonsContainer.style, { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1rem' });

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let intervalId = setInterval(() => {
        elapsed += stepMs;
        const secondsLeft = Math.max(0, Math.ceil((totalSeconds * 1000 - elapsed) / 1000));
        countdown.textContent = `${secondsLeft} s`;
        const pct = Math.min(100, (elapsed / (totalSeconds * 1000)) * 100);
        progressBarInner.style.width = pct + '%';
        progressBarOuter.setAttribute('aria-valuenow', ((elapsed / 1000)).toFixed(1));

        if (elapsed >= totalSeconds * 1000) {
            clearInterval(intervalId);
            window.location.href = 'avaliacao.html';
        }
    }, stepMs);

    voltarBtn.addEventListener('click', () => window.location.href = 'avaliacao.html');}

//Busca o valor de um cookie pelo nome
function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

//Salva o nome e id da sala no cookie
function salvar_sala_cookie(sala_id, sala_nome){
    document.cookie = `${'sala_id'}=${sala_id};path=/`; 
    document.cookie = `${'sala_nome'}=${sala_nome};path=/`; 
    window.location.href='avaliacao.html';
}
// ========================================
// QUIZZ.JS - Sistema de Quiz com múltiplos temas
// ========================================

// Configuração dos temas (nome do tema e arquivo JSON)
const temasDisponiveis = [
    { nome: "Física Basica", arquivo: "/data/fisica-basica.json" },
    { nome: "História Grega", arquivo: "/data/historia-grega.json" },
    { nome: "História (Idade media)", arquivo: "/data/historia-idade-media.json" },
    { nome: "História Romana", arquivo: "/data/historia-romana.json" },
    { nome: "Matemática Avançada", arquivo: "/data/matematica-avancada.json" },
    { nome: "Matemática Basica", arquivo: "/data/matematica-basica.json" },
    { nome: "Português", arquivo: "/data/portugues-basico.json" },
    { nome: "Química Basica", arquivo: "/data/quimica-basica.json" },
];

let perguntasCarregadas = {}; // { tema: [perguntas] }
let temasSelecionados = [];
let quantidadeSelecionada = 10; // padrão
let perguntasQuiz = [];
let respostasUsuario = [];
let perguntaAtual = 0;
let quizFinalizado = false;

// Elementos DOM
const telaConfig = document.getElementById('telaConfig');
const telaQuiz = document.getElementById('telaQuiz');
const listaTemas = document.getElementById('listaTemas');
const botoesQuantidade = document.querySelectorAll('.botao-quantidade');
const quantidadePersonalizada = document.getElementById('quantidadePersonalizada');
const btnIniciar = document.getElementById('btnIniciarQuiz');
const btnVoltarConfig = document.getElementById('btnVoltarConfig');
const btnReiniciar = document.getElementById('btnReiniciar');

// Elementos do quiz
const perguntaTexto = document.getElementById('perguntaTexto');
const opcoesContainer = document.getElementById('opcoesContainer');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');
const btnFinalizar = document.getElementById('btnFinalizar');
const resultadoArea = document.getElementById('resultadoArea');
const progressoPreenchido = document.getElementById('progressoPreenchido');
const perguntaAtualSpan = document.getElementById('perguntaAtual');
const totalPerguntasSpan = document.getElementById('totalPerguntas');
const feedbackDiv = document.getElementById('feedback');
const finalizarArea = document.getElementById('finalizarArea');

// ==================== FUNÇÕES AUXILIARES ====================
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Carregar todos os JSONs dos temas (ao iniciar a página)
async function carregarTodosOsTemas() {
    const promises = temasDisponiveis.map(async tema => {
        try {
            const response = await fetch(tema.arquivo);
            if (!response.ok) throw new Error(`Erro ao carregar ${tema.arquivo}`);
            const dados = await response.json();
            perguntasCarregadas[tema.nome] = dados;
            return { nome: tema.nome, qtd: dados.length };
        } catch (error) {
            console.error(error);
            return { nome: tema.nome, qtd: 0, erro: true };
        }
    });
    const resultados = await Promise.all(promises);
    renderizarListaTemas(resultados);
    // Carregar configurações salvas do localStorage
    carregarConfiguracoesSalvas();
}

function renderizarListaTemas(resultados) {
    listaTemas.innerHTML = '';
    resultados.forEach((tema, idx) => {
        const div = document.createElement('div');
        div.className = 'tema-card';
        if (temasSelecionados.includes(tema.nome)) div.classList.add('selecionado');
        div.innerHTML = `
            <div class="tema-nome">${tema.nome}</div>
            <div class="tema-qtd">${tema.qtd} perguntas</div>
        `;
        div.addEventListener('click', () => toggleTema(tema.nome));
        listaTemas.appendChild(div);
    });
}

function toggleTema(temaNome) {
    const index = temasSelecionados.indexOf(temaNome);
    if (index === -1) {
        temasSelecionados.push(temaNome);
    } else {
        temasSelecionados.splice(index, 1);
    }
    // Atualizar visual
    const cards = document.querySelectorAll('.tema-card');
    cards.forEach((card, i) => {
        const nomeTema = temasDisponiveis[i].nome;
        if (temasSelecionados.includes(nomeTema)) {
            card.classList.add('selecionado');
        } else {
            card.classList.remove('selecionado');
        }
    });
    salvarConfiguracoes();
}

function configurarQuantidade(qtd) {
    quantidadeSelecionada = qtd;
    // Atualizar visual dos botões
    botoesQuantidade.forEach(btn => {
        const btnQtd = parseInt(btn.dataset.qtd);
        if (btnQtd === qtd) {
            btn.classList.add('ativo');
        } else {
            btn.classList.remove('ativo');
        }
    });
    quantidadePersonalizada.value = (qtd > 0 && !isNaN(qtd)) ? qtd : '';
    salvarConfiguracoes();
}

function salvarConfiguracoes() {
    const config = {
        temasSelecionados,
        quantidadeSelecionada
    };
    localStorage.setItem('quizConfig', JSON.stringify(config));
}

function carregarConfiguracoesSalvas() {
    const saved = localStorage.getItem('quizConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            temasSelecionados = config.temasSelecionados || [];
            quantidadeSelecionada = config.quantidadeSelecionada || 10;
            // Atualizar visual dos temas (após carregar a lista)
            // O visual será atualizado quando a lista for renderizada (já acontece depois do carregamento)
            // Mas como a lista já foi carregada, precisamos re-renderizar com os temas selecionados
            if (listaTemas.children.length > 0) {
                const cards = document.querySelectorAll('.tema-card');
                cards.forEach((card, i) => {
                    const nomeTema = temasDisponiveis[i].nome;
                    if (temasSelecionados.includes(nomeTema)) {
                        card.classList.add('selecionado');
                    }
                });
            }
            // Atualizar quantidade
            configurarQuantidade(quantidadeSelecionada);
        } catch(e) { console.error(e); }
    }
}

// ==================== MONTAGEM DO QUIZ ====================
async function montarQuiz() {
    if (temasSelecionados.length === 0) {
        alert("Selecione pelo menos um tema.");
        return;
    }
    
    // Coletar perguntas dos temas selecionados
    let todasPerguntas = [];
    for (const tema of temasSelecionados) {
        if (perguntasCarregadas[tema]) {
            todasPerguntas.push(...perguntasCarregadas[tema]);
        }
    }
    
    if (todasPerguntas.length === 0) {
        alert("Nenhuma pergunta encontrada para os temas selecionados.");
        return;
    }
    
    // Embaralhar
    todasPerguntas = embaralharArray(todasPerguntas);
    
    // Selecionar quantidade
    let qtd = quantidadeSelecionada;
    if (qtd === 0 || qtd > todasPerguntas.length) {
        qtd = todasPerguntas.length;
    }
    perguntasQuiz = todasPerguntas.slice(0, qtd);
    
    // Inicializar estado do quiz
    respostasUsuario = new Array(perguntasQuiz.length).fill(-1);
    perguntaAtual = 0;
    quizFinalizado = false;
    
    // Trocar telas
    telaConfig.style.display = 'none';
    telaQuiz.style.display = 'block';
    
    // Atualizar UI do quiz
    totalPerguntasSpan.textContent = perguntasQuiz.length;
    atualizarProgresso();
    mostrarPergunta(perguntaAtual);
    atualizarBotoes();
    
    // Resetar áreas de resultado e finalizar
    resultadoArea.style.display = 'none';
    finalizarArea.style.display = 'none';
    feedbackDiv.classList.remove('mostrar', 'correto', 'errado');
}

function mostrarPergunta(indice) {
    const pergunta = perguntasQuiz[indice];
    if (!pergunta) return;
    
    perguntaTexto.textContent = pergunta.pergunta;
    
    // Renderizar opções
    opcoesContainer.innerHTML = '';
    const letras = ['A', 'B', 'C', 'D'];
    pergunta.opcoes.forEach((opcao, idx) => {
        const opcaoDiv = document.createElement('div');
        opcaoDiv.className = 'opcao';
        if (respostasUsuario[indice] === idx) {
            opcaoDiv.classList.add('selecionada');
        }
        opcaoDiv.innerHTML = `
            <div class="opcao-letra">${letras[idx]}</div>
            <div class="opcao-texto">${opcao}</div>
        `;
        opcaoDiv.addEventListener('click', () => selecionarOpcao(indice, idx));
        opcoesContainer.appendChild(opcaoDiv);
    });
    
    // Esconder feedback
    feedbackDiv.classList.remove('mostrar', 'correto', 'errado');
}

function selecionarOpcao(perguntaIdx, opcaoIdx) {
    if (quizFinalizado) return;
    
    // Atualizar visual
    const opcoes = document.querySelectorAll('.opcao');
    opcoes.forEach((op, idx) => {
        if (idx === opcaoIdx) {
            op.classList.add('selecionada');
        } else {
            op.classList.remove('selecionada');
        }
    });
    
    respostasUsuario[perguntaIdx] = opcaoIdx;
    
    // Feedback
    const pergunta = perguntasQuiz[perguntaIdx];
    const acertou = (opcaoIdx === pergunta.correta);
    feedbackDiv.textContent = acertou ? '✅ Correto!' : `❌ Errado! ${pergunta.explicacao ? ' ' + pergunta.explicacao : ''}`;
    feedbackDiv.classList.add('mostrar', acertou ? 'correto' : 'errado');
    
    atualizarProgresso();
    
    // Verificar se todas foram respondidas
    const todasRespondidas = respostasUsuario.every(r => r !== -1);
    if (todasRespondidas && perguntasQuiz.length > 0) {
        finalizarArea.style.display = 'block';
    } else {
        finalizarArea.style.display = 'none';
    }
}

function atualizarProgresso() {
    const respondidas = respostasUsuario.filter(r => r !== -1).length;
    const percentual = (respondidas / perguntasQuiz.length) * 100;
    progressoPreenchido.style.width = `${percentual}%`;
    perguntaAtualSpan.textContent = perguntaAtual + 1;
}

function irParaPergunta(delta) {
    const nova = perguntaAtual + delta;
    if (nova >= 0 && nova < perguntasQuiz.length) {
        perguntaAtual = nova;
        mostrarPergunta(perguntaAtual);
        atualizarProgresso();
        atualizarBotoes();
    }
}

function atualizarBotoes() {
    btnAnterior.disabled = perguntaAtual === 0;
    if (perguntaAtual === perguntasQuiz.length - 1) {
        btnProximo.textContent = 'Última ▶';
    } else {
        btnProximo.textContent = 'Próxima ▶';
    }
}

function finalizarQuiz() {
    if (quizFinalizado) return;
    
    let acertos = 0;
    const detalhes = [];
    perguntasQuiz.forEach((pergunta, idx) => {
        const resp = respostasUsuario[idx];
        const acertou = (resp === pergunta.correta);
        if (acertou) acertos++;
        detalhes.push({
            pergunta: pergunta.pergunta,
            respostaUsuario: resp !== -1 ? pergunta.opcoes[resp] : 'Não respondida',
            respostaCorreta: pergunta.opcoes[pergunta.correta],
            acertou: acertou && resp !== -1,
            explicacao: pergunta.explicacao
        });
    });
    
    const porcentagem = (acertos / perguntasQuiz.length) * 100;
    document.getElementById('pontuacao').innerHTML = `${acertos} / ${perguntasQuiz.length}<br><small>${porcentagem.toFixed(0)}% de acerto</small>`;
    
    const detalhesHtml = detalhes.map((d, i) => `
        <div class="detalhe-item ${d.acertou ? 'correto' : 'errado'}">
            <strong>Pergunta ${i+1}:</strong> ${d.pergunta}<br>
            <span>📌 Sua resposta: ${d.respostaUsuario}</span><br>
            <span>✅ Correta: ${d.respostaCorreta}</span><br>
            ${d.explicacao ? `<span class="texto-explicativo">💡 ${d.explicacao}</span>` : ''}
        </div>
    `).join('');
    
    document.getElementById('resultadoDetalhes').innerHTML = detalhesHtml;
    resultadoArea.style.display = 'block';
    finalizarArea.style.display = 'none';
    quizFinalizado = true;
    
    // Desabilitar interação com opções
    const opcoes = document.querySelectorAll('.opcao');
    opcoes.forEach(op => op.style.pointerEvents = 'none');
}

function voltarParaConfig() {
    telaQuiz.style.display = 'none';
    telaConfig.style.display = 'block';
    // Recarregar lista de temas para garantir (opcional)
}

function reiniciarQuiz() {
    montarQuiz(); // apenas reinicia com as mesmas configurações
}

// ==================== EVENT LISTENERS ====================
botoesQuantidade.forEach(btn => {
    btn.addEventListener('click', () => {
        const qtd = parseInt(btn.dataset.qtd);
        configurarQuantidade(qtd);
    });
});

quantidadePersonalizada.addEventListener('change', () => {
    let val = parseInt(quantidadePersonalizada.value);
    if (isNaN(val) || val < 1) val = 0; // 0 = todas
    configurarQuantidade(val);
});

btnIniciar.addEventListener('click', montarQuiz);
btnVoltarConfig.addEventListener('click', voltarParaConfig);
btnReiniciar.addEventListener('click', reiniciarQuiz);
btnFinalizar.addEventListener('click', finalizarQuiz);
btnAnterior.addEventListener('click', () => irParaPergunta(-1));
btnProximo.addEventListener('click', () => {
    if (perguntaAtual === perguntasQuiz.length - 1) return;
    irParaPergunta(1);
});

// Inicializar
carregarTodosOsTemas();
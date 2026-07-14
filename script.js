// === CONFIGURACOES DOS MODOS ===
var MODOS = {
    facil: {
        nome: 'Mosca das frutas',
        numPares: 4,
        tamanhos: [160, 130, 100, 70]
    },
    medio: {
        nome: 'Cenoura',
        numPares: 9,
        tamanhos: [160, 148, 136, 124, 112, 100, 88, 76, 64]
    },
    dificil: {
        nome: 'Ouriço do mar',
        numPares: 18,
        tamanhos: [160, 154, 148, 142, 136, 130, 124, 118, 112, 106, 100, 94, 88, 82, 76, 70, 64, 58]
    },
    mestre: {
        nome: 'Humano',
        numPares: 23,
        tamanhos: [160, 154, 148, 142, 136, 130, 124, 118, 112, 106, 100, 94, 88, 82, 76, 70, 64, 58, 52, 46, 40, 34, 28]
    }
};

// Paleta fixa de 23 cores (usaremos as N primeiras conforme o modo)
var CORES_COMPLETAS = [
    '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231',
    '#911EB4', '#42D4F4', '#F032E6', '#BFEF45', '#469990',
    '#DCBEFF', '#9A6324', '#FF4500', '#00CED1', '#800000',
    '#AAFFC3', '#808000', '#FF1493', '#000075', '#FFD700',
    '#FF6347', '#7B68EE', '#20B2AA'
];

// Variáveis globais (serão definidas no init)
var MODO_ATUAL;
var NUM_PARES;
var TOTAL_CARTAS;
var CORES;
var TAMANHOS;
var NUM_COLUNAS = 4; // fixo

var CHANCE_DUPLICACAO = 0.10;

// Elementos DOM
var gradeCartas = document.getElementById('gradeCartas');
var contadorPares = document.getElementById('contadorPares');
var cariotipoFinal = document.getElementById('cariotipoFinal');
var paresOrdenados = document.getElementById('paresOrdenados');

var cartas = [];
var cartasViradas = [];
var paresEncontrados = 0;
var bloqueado = false;
var jogoFinalizado = false;

// === LEITURA DO MODO VIA URL ===
function obterModo() {
    var params = new URLSearchParams(window.location.search);
    var modo = params.get('modo');
    if (modo && MODOS[modo]) {
        return modo;
    }
    return 'mestre'; // padrão
}

// === INICIALIZACAO DAS VARIAVEIS DO MODO ===
function configurarModo(modo) {
    MODO_ATUAL = modo;
    var config = MODOS[modo];
    NUM_PARES = config.numPares;
    TOTAL_CARTAS = NUM_PARES * 2;
    CORES = CORES_COMPLETAS.slice(0, NUM_PARES);
    TAMANHOS = config.tamanhos;
}

// === GERACAO DE SVG DOS CROMOSSOMOS ===
function gerarSVGCromossomo(indicePar, duplicado) {
    if (duplicado === undefined) duplicado = false;
    var cor = CORES[indicePar];
    var alturaTotal = TAMANHOS[indicePar];
    var larguraBraco = 14;
    var gapCentromero = 5;
    var alturaBraco = (alturaTotal - gapCentromero) / 2;

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    
    if (duplicado) {
        var larguraTotal = larguraBraco * 2 + 8;
        svg.setAttribute('viewBox', '0 0 ' + (larguraTotal * 2 + 8) + ' ' + (alturaTotal + 4));
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        desenharCromossomo(svg, 2, 2, larguraBraco, alturaBraco, gapCentromero, cor);
        desenharCromossomo(svg, 2 + larguraBraco + 8, 2, larguraBraco, alturaBraco, gapCentromero, cor);
    } else {
        svg.setAttribute('viewBox', '0 0 ' + (larguraBraco + 4) + ' ' + (alturaTotal + 4));
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        desenharCromossomo(svg, 2, 2, larguraBraco, alturaBraco, gapCentromero, cor);
    }
    
    return svg;
}

function desenharCromossomo(svg, x, y, largura, alturaBraco, gap, cor) {
    var svgNS = 'http://www.w3.org/2000/svg';
    
    var rect1 = document.createElementNS(svgNS, 'rect');
    rect1.setAttribute('x', x);
    rect1.setAttribute('y', y);
    rect1.setAttribute('width', largura);
    rect1.setAttribute('height', alturaBraco);
    rect1.setAttribute('rx', '6');
    rect1.setAttribute('ry', '6');
    rect1.setAttribute('fill', cor);
    svg.appendChild(rect1);
    
    var rect2 = document.createElementNS(svgNS, 'rect');
    rect2.setAttribute('x', x);
    rect2.setAttribute('y', y + alturaBraco + gap);
    rect2.setAttribute('width', largura);
    rect2.setAttribute('height', alturaBraco);
    rect2.setAttribute('rx', '6');
    rect2.setAttribute('ry', '6');
    rect2.setAttribute('fill', cor);
    svg.appendChild(rect2);
    
    var line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y + alturaBraco + gap/2);
    line.setAttribute('x2', x + largura);
    line.setAttribute('y2', y + alturaBraco + gap/2);
    line.setAttribute('stroke', '#ffffff');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(line);
}

// === INICIALIZACAO DO BARALHO ===
function criarBaralho() {
    var baralho = [];
    
    var temDuplicacao = Math.random() < CHANCE_DUPLICACAO;
    var parDuplicado = -1;
    if (temDuplicacao) {
        parDuplicado = Math.floor(Math.random() * NUM_PARES);
    }
    
    for (var i = 0; i < NUM_PARES; i++) {
        var duplicada = (i === parDuplicado);
        
        if (duplicada) {
            baralho.push({ pairId: i, duplicado: false, idUnico: i + '-a' });
            baralho.push({ pairId: i, duplicado: true, idUnico: i + '-b' });
        } else {
            baralho.push({ pairId: i, duplicado: false, idUnico: i + '-a' });
            baralho.push({ pairId: i, duplicado: false, idUnico: i + '-b' });
        }
    }
    
    for (var i = baralho.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = baralho[i];
        baralho[i] = baralho[j];
        baralho[j] = temp;
    }
    
    return baralho;
}

// === AJUSTAR GRADE (CSS Grid dinâmico) ===
function configurarGrade() {
    var numLinhas = Math.ceil(TOTAL_CARTAS / NUM_COLUNAS);
    gradeCartas.style.gridTemplateRows = 'repeat(' + numLinhas + ', 1fr)';
    
    // Centralizar cartas da última linha
    var cartasNaUltimaLinha = TOTAL_CARTAS % NUM_COLUNAS;
    if (cartasNaUltimaLinha === 0) return; // nada a fazer
    
    var cartasDOM = gradeCartas.children;
    var inicioUltimaLinha = TOTAL_CARTAS - cartasNaUltimaLinha;
    
    // Remove estilos anteriores de grid-column
    for (var i = 0; i < cartasDOM.length; i++) {
        cartasDOM[i].style.gridColumn = '';
    }
    
    // Posiciona as cartas da última linha nas colunas centrais
    var colunaInicial = Math.floor((NUM_COLUNAS - cartasNaUltimaLinha) / 2) + 1;
    for (var i = 0; i < cartasNaUltimaLinha; i++) {
        var idx = inicioUltimaLinha + i;
        cartasDOM[idx].style.gridColumn = (colunaInicial + i) + ' / ' + (colunaInicial + i + 1);
    }
}

// === CONSTRUIR INTERFACE DAS CARTAS ===
function construirGrade() {
    if (!gradeCartas) return;
    
    gradeCartas.innerHTML = '';
    cartas = criarBaralho();
    paresEncontrados = 0;
    jogoFinalizado = false;
    cartasViradas = [];
    bloqueado = false;
    atualizarContador();
    if (cariotipoFinal) cariotipoFinal.style.display = 'none';
    
    for (var i = 0; i < cartas.length; i++) {
        (function(index) {
            var carta = cartas[index];
            var divCarta = document.createElement('div');
            divCarta.className = 'carta';
            divCarta.dataset.index = index;
            divCarta.dataset.pairId = carta.pairId;
            
            var inner = document.createElement('div');
            inner.className = 'carta-inner';
            
            var verso = document.createElement('div');
            verso.className = 'carta-face carta-verso';
            verso.textContent = 'MYX';
            
            var frente = document.createElement('div');
            frente.className = 'carta-face carta-frente';
            
            var svg = gerarSVGCromossomo(carta.pairId, carta.duplicado);
            frente.appendChild(svg);
            
            inner.appendChild(verso);
            inner.appendChild(frente);
            divCarta.appendChild(inner);
            
            divCarta.addEventListener('click', function() {
                virarCarta(divCarta, index);
            });
            
            gradeCartas.appendChild(divCarta);
        })(i);
    }
    
    configurarGrade();
}

// === LOGICA DE VIRADA ===
function virarCarta(elementoCarta, index) {
    if (bloqueado || jogoFinalizado) return;
    if (elementoCarta.classList.contains('flipped') || elementoCarta.classList.contains('matched')) return;
    if (cartasViradas.length >= 2) return;
    
    elementoCarta.classList.add('flipped');
    cartasViradas.push({ elemento: elementoCarta, index: index });
    
    if (cartasViradas.length === 2) {
        verificarPar();
    }
}

function verificarPar() {
    var primeira = cartasViradas[0];
    var segunda = cartasViradas[1];
    var id1 = cartas[primeira.index].pairId;
    var id2 = cartas[segunda.index].pairId;
    
    if (id1 === id2) {
        primeira.elemento.classList.add('matched');
        segunda.elemento.classList.add('matched');
        paresEncontrados++;
        atualizarContador();
        tocarSomAcerto();
        
        cartasViradas = [];
        
        if (paresEncontrados === NUM_PARES) {
            finalizarJogo();
        }
    } else {
        bloqueado = true;
        setTimeout(function() {
            primeira.elemento.classList.remove('flipped');
            segunda.elemento.classList.remove('flipped');
            cartasViradas = [];
            bloqueado = false;
        }, 1000);
    }
}

function tocarSomAcerto() {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
}

function atualizarContador() {
    if (contadorPares) {
        contadorPares.textContent = paresEncontrados + ' / ' + NUM_PARES;
    }
}

function finalizarJogo() {
    jogoFinalizado = true;
    exibirCariotipo();
}

function exibirCariotipo() {
    if (!paresOrdenados) return;
    paresOrdenados.innerHTML = '';
    for (var i = 0; i < NUM_PARES; i++) {
        var divPar = document.createElement('div');
        divPar.className = 'par-cariotipo';
        
        var svg1 = gerarSVGCromossomo(i, false);
        var svg2 = gerarSVGCromossomo(i, false);
        svg1.style.width = '30px';
        svg1.style.height = 'auto';
        svg2.style.width = '30px';
        svg2.style.height = 'auto';
        
        divPar.appendChild(svg1);
        divPar.appendChild(svg2);
        paresOrdenados.appendChild(divPar);
    }
    if (cariotipoFinal) {
        cariotipoFinal.style.display = 'block';
    }
}

function reiniciarJogo() {
    construirGrade();
}

// === INICIALIZACAO ===
var modo = obterModo();
configurarModo(modo);
construirGrade();
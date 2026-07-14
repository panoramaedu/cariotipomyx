// === CONFIGURAÇÕES ===
const NUM_PARES = 23;
const TOTAL_CARTAS = NUM_PARES * 2; // 46
const CHANCE_DUPLICACAO = 0.10;     // 10% de chance por partida

// Paleta de 23 cores vibrantes (fantasia)
const CORES = [
    '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231',
    '#911EB4', '#42D4F4', '#F032E6', '#BFEF45', '#469990',
    '#DCBEFF', '#9A6324', '#FF4500', '#00CED1', '#800000',
    '#AAFFC3', '#808000', '#FF1493', '#000075', '#FFD700',
    '#FF6347', '#7B68EE', '#20B2AA'
];

// Tamanhos dos cromossomos (altura em px) – exagerados
const TAMANHOS = [
    160, 154, 148, 142, 136, 130, 124, 118, 112, 106,
    100,  94,  88,  82,  76,  70,  64,  58,  52,  46,
     40,  34,  28
];

// === ELEMENTOS DOM ===
const gradeCartas = document.getElementById('gradeCartas');
const contadorPares = document.getElementById('contadorPares');
const cariotipoFinal = document.getElementById('cariotipoFinal');
const paresOrdenados = document.getElementById('paresOrdenados');

// === ESTADO DO JOGO ===
let cartas = [];
let cartasViradas = [];
let paresEncontrados = 0;
let bloqueado = false;          // impede cliques durante animação
let jogoFinalizado = false;

// === GERAÇÃO DE SVG DOS CROMOSSOMOS ===
function gerarSVGCromossomo(indicePar, duplicado = false) {
    const cor = CORES[indicePar];
    const alturaTotal = TAMANHOS[indicePar];
    const larguraBraco = 14;
    const gapCentromero = 5;
    const alturaBraco = (alturaTotal - gapCentromero) / 2;

    // Grupo SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    
    if (duplicado) {
        // Dois cromossomos lado a lado
        const larguraTotal = larguraBraco * 2 + 8; // espaçamento de 8px entre eles
        svg.setAttribute('viewBox', `0 0 ${larguraTotal * 2 + 8} ${alturaTotal + 4}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        // Primeiro cromossomo
        desenharCromossomo(svg, 2, 2, larguraBraco, alturaBraco, gapCentromero, cor);
        // Segundo cromossomo
        desenharCromossomo(svg, 2 + larguraBraco + 8, 2, larguraBraco, alturaBraco, gapCentromero, cor);
    } else {
        svg.setAttribute('viewBox', `0 0 ${larguraBraco + 4} ${alturaTotal + 4}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        desenharCromossomo(svg, 2, 2, larguraBraco, alturaBraco, gapCentromero, cor);
    }
    
    return svg;
}

function desenharCromossomo(svg, x, y, largura, alturaBraco, gap, cor) {
    const svgNS = 'http://www.w3.org/2000/svg';
    
    // Braço superior
    const rect1 = document.createElementNS(svgNS, 'rect');
    rect1.setAttribute('x', x);
    rect1.setAttribute('y', y);
    rect1.setAttribute('width', largura);
    rect1.setAttribute('height', alturaBraco);
    rect1.setAttribute('rx', '6');
    rect1.setAttribute('ry', '6');
    rect1.setAttribute('fill', cor);
    svg.appendChild(rect1);
    
    // Braço inferior
    const rect2 = document.createElementNS(svgNS, 'rect');
    rect2.setAttribute('x', x);
    rect2.setAttribute('y', y + alturaBraco + gap);
    rect2.setAttribute('width', largura);
    rect2.setAttribute('height', alturaBraco);
    rect2.setAttribute('rx', '6');
    rect2.setAttribute('ry', '6');
    rect2.setAttribute('fill', cor);
    svg.appendChild(rect2);
    
    // Centrômero (linha sutil)
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y + alturaBraco + gap/2);
    line.setAttribute('x2', x + largura);
    line.setAttribute('y2', y + alturaBraco + gap/2);
    line.setAttribute('stroke', '#ffffff');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(line);
}

// === INICIALIZAÇÃO DO BARALHO ===
function criarBaralho() {
    const baralho = [];
    
    // Sorteia se haverá duplicação nesta partida
    const temDuplicacao = Math.random() < CHANCE_DUPLICACAO;
    let parDuplicado = -1;
    if (temDuplicacao) {
        parDuplicado = Math.floor(Math.random() * NUM_PARES);
    }
    
    // Gera as cartas
    for (let i = 0; i < NUM_PARES; i++) {
        const duplicada = (i === parDuplicado);
        
        if (duplicada) {
            // Uma carta normal e uma duplicada
            baralho.push({
                pairId: i,
                duplicado: false,
                idUnico: `${i}-a`
            });
            baralho.push({
                pairId: i,
                duplicado: true,
                idUnico: `${i}-b`
            });
        } else {
            // Duas cartas normais
            baralho.push({
                pairId: i,
                duplicado: false,
                idUnico: `${i}-a`
            });
            baralho.push({
                pairId: i,
                duplicado: false,
                idUnico: `${i}-b`
            });
        }
    }
    
    // Embaralhar
    for (let i = baralho.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
    }
    
    return baralho;
}

// === CONSTRUIR INTERFACE DAS CARTAS ===
function construirGrade() {
    gradeCartas.innerHTML = '';
    cartas = criarBaralho();
    paresEncontrados = 0;
    jogoFinalizado = false;
    cartasViradas = [];
    bloqueado = false;
    atualizarContador();
    cariotipoFinal.style.display = 'none';
    
    cartas.forEach((carta, index) => {
        const divCarta = document.createElement('div');
        divCarta.className = 'carta';
        divCarta.dataset.index = index;
        divCarta.dataset.pairId = carta.pairId;
        
        const inner = document.createElement('div');
        inner.className = 'carta-inner';
        
        // Verso
        const verso = document.createElement('div');
        verso.className = 'carta-face carta-verso';
        verso.textContent = 'MYX';
        
        // Frente
        const frente = document.createElement('div');
        frente.className = 'carta-face carta-frente';
        
        // Adiciona o SVG do cromossomo
        const svg = gerarSVGCromossomo(carta.pairId, carta.duplicado);
        frente.appendChild(svg);
        
        inner.appendChild(verso);
        inner.appendChild(frente);
        divCarta.appendChild(inner);
        
        divCarta.addEventListener('click', () => virarCarta(divCarta, index));
        gradeCartas.appendChild(divCarta);
    });
    // ... dentro de construirGrade(), após o loop que adiciona as cartas

    // Centralizar as duas últimas cartas (índices 44 e 45) em grades de 4 colunas
    if (gradeCartas.children.length === TOTAL_CARTAS) {
        // Funciona apenas se a grid tiver 4 colunas (desktop)
        const cartasDOM = gradeCartas.children;
        cartasDOM[TOTAL_CARTAS - 2].style.gridColumn = '2 / 3'; // penúltima
        cartasDOM[TOTAL_CARTAS - 1].style.gridColumn = '3 / 4'; // última
    }
}

// === LÓGICA DE VIRADA ===
function virarCarta(elementoCarta, index) {
    if (bloqueado || jogoFinalizado) return;
    if (elementoCarta.classList.contains('flipped') || elementoCarta.classList.contains('matched')) return;
    if (cartasViradas.length >= 2) return;
    
    // Virar
    elementoCarta.classList.add('flipped');
    cartasViradas.push({ elemento: elementoCarta, index });
    
    if (cartasViradas.length === 2) {
        verificarPar();
    }
}

function verificarPar() {
    const [primeira, segunda] = cartasViradas;
    const id1 = cartas[primeira.index].pairId;
    const id2 = cartas[segunda.index].pairId;
    
    if (id1 === id2) {
        // Acerto
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
        // Erro – desvirar após 1 segundo
        bloqueado = true;
        setTimeout(() => {
            primeira.elemento.classList.remove('flipped');
            segunda.elemento.classList.remove('flipped');
            cartasViradas = [];
            bloqueado = false;
        }, 1000);
    }
}

// === SOM DE ACERTO (Web Audio API) ===
function tocarSomAcerto() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        // Áudio não suportado
    }
}

// === ATUALIZAR PAINEL ===
function atualizarContador() {
    contadorPares.textContent = `${paresEncontrados} / ${NUM_PARES}`;
}

// === FINALIZAÇÃO ===
function finalizarJogo() {
    jogoFinalizado = true;
    exibirCariotipo();
}

function exibirCariotipo() {
    paresOrdenados.innerHTML = '';
    // Ordenar pares do maior para o menor (índice 0 = maior)
    for (let i = 0; i < NUM_PARES; i++) {
        const divPar = document.createElement('div');
        divPar.className = 'par-cariotipo';
        
        // Desenha dois cromossomos normais (sem duplicação)
        const svg1 = gerarSVGCromossomo(i, false);
        const svg2 = gerarSVGCromossomo(i, false);
        svg1.style.width = '30px';
        svg1.style.height = 'auto';
        svg2.style.width = '30px';
        svg2.style.height = 'auto';
        
        divPar.appendChild(svg1);
        divPar.appendChild(svg2);
        paresOrdenados.appendChild(divPar);
    }
    cariotipoFinal.style.display = 'block';
}

// === REINICIAR ===
function reiniciarJogo() {
    construirGrade();
}

// === INICIAR AO CARREGAR A PÁGINA ===
window.onload = () => {
    construirGrade();
};

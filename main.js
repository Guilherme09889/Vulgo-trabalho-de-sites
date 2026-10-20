const CHAVE_ARRAY = "valores-array";
const CHAVE_HISTORICO = "valores-historico";
const LIMITE_HISTORICO = 5;

const listaValores = document.getElementById("lista-valores");
const historicoLista = document.getElementById("historico-lista");
const form = document.getElementById("form-operacao");
const campo = document.getElementById("campo-valor");
const nota = document.getElementById("nota");

const NOTA_PADRAO = nota.textContent;

const formatarReais = (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function carregar(chave, padrao) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : padrao;
    } catch {
        return padrao;
    }
}

const valores = carregar(CHAVE_ARRAY, [10, 25.5, 40]);
const historico = carregar(CHAVE_HISTORICO, []);

function salvar() {
    localStorage.setItem(CHAVE_ARRAY, JSON.stringify(valores));
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
}

function renderizarValores(indiceNovo = -1) {
    listaValores.replaceChildren();
    valores.forEach((v, i) => {
        const li = document.createElement("li");
        li.className = "valor" + (i === indiceNovo ? " novo" : "");
        li.textContent = formatarReais(v);
        listaValores.appendChild(li);
    });
}

function renderizarHistorico() {
    historicoLista.replaceChildren();
    if (historico.length === 0) {
        const li = document.createElement("li");
        li.className = "historico-texto";
        li.textContent = "Nenhuma operação registrada.";
        historicoLista.appendChild(li);
        return;
    }
    historico.forEach((item) => {
        const li = document.createElement("li");
        li.className = "historico-texto";
        const hora = new Date(item.data).toLocaleTimeString("pt-BR");
        li.textContent = `${hora} · push(${formatarReais(item.valor)}) → [${item.array
            .map((v) => v.toFixed(2).replace(".", ","))
            .join(", ")}]`;
        historicoLista.appendChild(li);
    });
}

function mostrarNota(texto, erro = false) {
    nota.textContent = texto;
    nota.style.color = erro ? "red" : "";
}

form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const valor = Math.round(parseFloat(campo.value) * 100) / 100;
    if (!Number.isFinite(valor) || valor <= 0) {
        mostrarNota("Informe um valor maior que zero.", true);
        campo.focus();
        return;
    }

    valores.push(valor);
    historico.unshift({ data: Date.now(), valor, array: [...valores] });
    historico.length = Math.min(historico.length, LIMITE_HISTORICO);
    salvar();

    renderizarValores(valores.length - 1);
    renderizarHistorico();
    renderizarIndices();
    mostrarNota(NOTA_PADRAO);
    form.reset();
    campo.focus();
});

campo.addEventListener("input", () => mostrarNota(NOTA_PADRAO));

renderizarValores();
renderizarHistorico();

/* ---------- filter() ---------- */
const CHAVE_HISTORICO_FILTRO = "valores-historico-filter";

const FAIXAS = {
    menor: { rotulo: "Menor que R$ 10", testar: (v) => v < 10 },
    entre: { rotulo: "De R$ 10 a R$ 20", testar: (v) => v >= 10 && v <= 20 },
    maior: { rotulo: "Maior que R$ 20", testar: (v) => v > 20 },
};

const formFiltro = document.getElementById("form-filtro");
const faixaFiltro = document.getElementById("faixa-filtro");
const resultadoFiltro = document.getElementById("resultado-filtro");
const historicoFiltroLista = document.getElementById("historico-filtro");
const botaoLimparFiltro = document.getElementById("limpar-filtro");

const historicoFiltro = carregar(CHAVE_HISTORICO_FILTRO, []);

function renderizarResultadoFiltro(filtrados) {
    resultadoFiltro.replaceChildren();
    if (filtrados.length === 0) {
        const li = document.createElement("li");
        li.className = "nota";
        li.textContent = "Nenhum valor atende à condição.";
        resultadoFiltro.appendChild(li);
        return;
    }
    filtrados.forEach((v) => {
        const li = document.createElement("li");
        li.className = "valor novo";
        li.textContent = formatarReais(v);
        resultadoFiltro.appendChild(li);
    });
}

function renderizarHistoricoFiltro() {
    historicoFiltroLista.replaceChildren();
    if (historicoFiltro.length === 0) {
        const li = document.createElement("li");
        li.className = "historico-texto";
        li.textContent = "Nenhum filtro aplicado.";
        historicoFiltroLista.appendChild(li);
        return;
    }
    historicoFiltro.forEach((item) => {
        const li = document.createElement("li");
        li.className = "historico-texto";
        const quando = new Date(item.data);
        const dataHora = `${quando.toLocaleDateString("pt-BR")} • ${quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
        li.textContent = `${dataHora} — ${item.rotulo}. Resultado: [${item.resultado.join(", ")}]`;
        historicoFiltroLista.appendChild(li);
    });
}

formFiltro.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const faixa = FAIXAS[faixaFiltro.value];
    const filtrados = valores.filter(faixa.testar);

    historicoFiltro.unshift({ data: Date.now(), rotulo: faixa.rotulo, resultado: filtrados });
    localStorage.setItem(CHAVE_HISTORICO_FILTRO, JSON.stringify(historicoFiltro));

    renderizarResultadoFiltro(filtrados);
    renderizarHistoricoFiltro();
});

botaoLimparFiltro.addEventListener("click", () => {
    historicoFiltro.length = 0;
    localStorage.setItem(CHAVE_HISTORICO_FILTRO, JSON.stringify(historicoFiltro));
    renderizarHistoricoFiltro();
});

renderizarHistoricoFiltro();

/* ---------- histórico genérico (map e splice) ---------- */
function criarHistorico(chave, lista, botaoLimpar, textoVazio, descrever) {
    const itens = carregar(chave, []);

    const renderizar = () => {
        lista.replaceChildren();
        if (itens.length === 0) {
            const li = document.createElement("li");
            li.className = "historico-texto";
            li.textContent = textoVazio;
            lista.appendChild(li);
            return;
        }
        itens.forEach((item) => {
            const li = document.createElement("li");
            li.className = "historico-texto";
            const quando = new Date(item.data);
            const dataHora = `${quando.toLocaleDateString("pt-BR")} • ${quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
            li.textContent = `${dataHora} — ${descrever(item)}`;
            lista.appendChild(li);
        });
    };

    const persistir = () => localStorage.setItem(chave, JSON.stringify(itens));

    botaoLimpar.addEventListener("click", () => {
        itens.length = 0;
        persistir();
        renderizar();
    });

    renderizar();

    return {
        registrar(item) {
            itens.unshift({ data: Date.now(), ...item });
            persistir();
            renderizar();
        },
    };
}

/* ---------- map() ---------- */
const moeda = (codigo) => (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: codigo });

const TRANSFORMACOES = {
    dolar: { rotulo: "Conversão BRL → USD", taxa: "US$ 1,00 = R$ 5,00", converter: (v) => moeda("USD")(v / 5) },
    euro: { rotulo: "Conversão BRL → EUR", taxa: "€ 1,00 = R$ 6,00", converter: (v) => moeda("EUR")(v / 6) },
    emoji: { rotulo: "Emoji 💰", taxa: "", converter: (v) => "💰 " + v.toFixed(2).replace(".", ",") },
};

const formMap = document.getElementById("form-map");
const tipoMap = document.getElementById("tipo-map");
const resultadoMap = document.getElementById("resultado-map");

const historicoMap = criarHistorico(
    "valores-historico-map",
    document.getElementById("historico-map"),
    document.getElementById("limpar-map"),
    "Nenhuma transformação aplicada.",
    (item) => `${item.rotulo}${item.taxa ? ` (${item.taxa})` : ""}. Resultado: [${item.resultado.join(", ")}]`
);

formMap.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const transformacao = TRANSFORMACOES[tipoMap.value];
    const transformados = valores.map(transformacao.converter);

    resultadoMap.replaceChildren();
    transformados.forEach((texto) => {
        const li = document.createElement("li");
        li.className = "valor novo";
        li.textContent = texto;
        resultadoMap.appendChild(li);
    });

    historicoMap.registrar({
        rotulo: transformacao.rotulo,
        taxa: transformacao.taxa,
        resultado: transformados,
    });
});

/* ---------- splice() ---------- */
const listaIndices = document.getElementById("lista-indices");
const formSplice = document.getElementById("form-splice");
const campoIndice = document.getElementById("campo-indice");
const campoQuantidade = document.getElementById("campo-quantidade");
const notaSplice = document.getElementById("nota-splice");
const removidosSplice = document.getElementById("removidos-splice");

const NOTA_SPLICE = notaSplice.textContent;

const historicoSplice = criarHistorico(
    "valores-historico-splice",
    document.getElementById("historico-splice"),
    document.getElementById("limpar-splice"),
    "Nenhuma remoção realizada.",
    (item) =>
        `Índice ${item.indice}; quantidade ${item.quantidade}. Removidos: [${item.removidos
            .map(formatarReais)
            .join(", ")}]`
);

function renderizarIndices() {
    listaIndices.replaceChildren();
    if (valores.length === 0) {
        const li = document.createElement("li");
        li.className = "nota";
        li.textContent = "O array está vazio.";
        listaIndices.appendChild(li);
        return;
    }
    valores.forEach((v, i) => {
        const li = document.createElement("li");
        li.className = "valor";
        li.textContent = `${i} → ${formatarReais(v)}`;
        listaIndices.appendChild(li);
    });
}

function mostrarNotaSplice(texto, erro = false) {
    notaSplice.textContent = texto;
    notaSplice.style.color = erro ? "red" : "";
}

formSplice.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const indice = Number(campoIndice.value);
    const quantidade = Number(campoQuantidade.value);

    if (campoIndice.value === "" || !Number.isInteger(indice) || indice < 0 || indice >= valores.length) {
        mostrarNotaSplice(
            valores.length === 0
                ? "O array está vazio."
                : `Índice inválido. Use um inteiro de 0 a ${valores.length - 1}.`,
            true
        );
        campoIndice.focus();
        return;
    }

    if (campoQuantidade.value === "" || !Number.isInteger(quantidade) || quantidade < 1 || indice + quantidade > valores.length) {
        mostrarNotaSplice(
            `Quantidade inválida. Use um inteiro de 1 a ${valores.length - indice}.`,
            true
        );
        campoQuantidade.focus();
        return;
    }

    const removidos = valores.splice(indice, quantidade);
    salvar();

    renderizarValores();
    renderizarIndices();

    removidosSplice.replaceChildren();
    removidos.forEach((v) => {
        const li = document.createElement("li");
        li.className = "valor removido";
        li.textContent = formatarReais(v);
        removidosSplice.appendChild(li);
    });

    historicoSplice.registrar({ indice, quantidade, removidos });
    mostrarNotaSplice(NOTA_SPLICE);
    formSplice.reset();
});

[campoIndice, campoQuantidade].forEach((c) =>
    c.addEventListener("input", () => mostrarNotaSplice(NOTA_SPLICE))
);

renderizarIndices();

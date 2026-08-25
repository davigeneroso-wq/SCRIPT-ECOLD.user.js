// ==UserScript==
// @name         🚀 PCP e-Cold AUTO v4
// @namespace    pcp.ecold
// @version      4.0
// @updateURL    https://raw.githubusercontent.com/davigeneroso-wq/pcp-repom/main/SCRIPT%20ECOLD.user.js
// @downloadURL  https://raw.githubusercontent.com/davigeneroso-wq/pcp-repom/main/SCRIPT%20ECOLD.user.js
// @description  Scanner NF-e + Conversão Automática + Pesquisa + Valores + Total + Download
// @match        https://webnfe.e-datacenter.nddigital.com.br/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {

'use strict';

// =========================================================
// CONFIGURAÇÕES
// =========================================================

const STORAGE = "PCP_ECOLD_NOTAS";
const STORAGE_VALORES = "PCP_ECOLD_VALORES";

const UF = {
"11":"RO","12":"AC","13":"AM","14":"RR","15":"PA","16":"AP","17":"TO",
"21":"MA","22":"PI","23":"CE","24":"RN","25":"PB","26":"PE","27":"AL",
"28":"SE","29":"BA","31":"MG","32":"ES","33":"RJ","35":"SP","41":"PR",
"42":"SC","43":"RS","50":"MS","51":"MT","52":"GO","53":"DF"
};

// =========================================================
// VARIÁVEIS
// =========================================================

let notas = JSON.parse(
localStorage.getItem(STORAGE) || "[]"
);

let valoresNFe = JSON.parse(
localStorage.getItem(STORAGE_VALORES) || "{}"
);

let ultimaUF = "--";
let ultimaNota = "--";

let painel = null;

// =========================================================
// STORAGE
// =========================================================

function salvar() {

localStorage.setItem(
    STORAGE,
    JSON.stringify(notas)
);

localStorage.setItem(
    STORAGE_VALORES,
    JSON.stringify(valoresNFe)
);

atualizarPainel();


}

// =========================================================
// LISTA PARA e-COLD
// =========================================================

function lista() {

return notas.join(";");


}

// =========================================================
// LIMPAR
// =========================================================

function limpar() {

notas = [];
valoresNFe = {};

ultimaUF = "--";
ultimaNota = "--";

localStorage.removeItem(STORAGE);
localStorage.removeItem(STORAGE_VALORES);

const campo =
    document.querySelector("#IDE_NNF");

if (campo) {

    campo.value = "";

    campo.dispatchEvent(
        new Event("input", {
            bubbles: true
        })
    );

    campo.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );
}

atualizarPainel();

status("🗑 Lista limpa.");


}

// =========================================================
// CONVERSOR DE CHAVE NF-e
// =========================================================

function converter(chave) {

chave = String(chave || "")
    .replace(/\D/g, "");

if (chave.length !== 44) {

    console.log(
        "⚠ Chave inválida:",
        chave,
        "Tamanho:",
        chave.length
    );

    return null;
}

const uf =
    UF[chave.substring(0, 2)] || "--";

/*
 * Chave NF-e:
 *
 * posições 26 até 34 = número da NF
 *
 * substring(25,34)
 */

const numero =
    chave.substring(25, 34);

const notaNumero =
    parseInt(numero, 10);

if (
    isNaN(notaNumero) ||
    notaNumero <= 0
) {

    console.log(
        "⚠ Não foi possível converter NF:",
        chave
    );

    return null;
}

const nota =
    String(notaNumero);

console.log(
    "🔄 CHAVE CONVERTIDA:",
    chave,
    "→ UF:",
    uf,
    "→ NF:",
    nota
);

return {
    uf: uf,
    nota: nota,
    chave: chave
};


}

// =========================================================
// COLOCAR NF CONVERTIDA NO CAMPO DO SISTEMA
// =========================================================

function preencherCampoPesquisa() {

const campo =
    document.querySelector("#IDE_NNF");

if (!campo) {

    console.log(
        "⚠ Campo #IDE_NNF ainda não encontrado."
    );

    return false;
}

const valor =
    lista();

campo.focus();

campo.value = valor;

/*
 * Dispara os eventos que o sistema
 * pode utilizar para reconhecer a alteração.
 */

campo.dispatchEvent(
    new Event("input", {
        bubbles: true
    })
);

campo.dispatchEvent(
    new Event("change", {
        bubbles: true
    })
);

campo.dispatchEvent(
    new Event("blur", {
        bubbles: true
    })
);

console.log(
    "📝 Campo #IDE_NNF preenchido:",
    valor
);

return true;


}

// =========================================================
// ADICIONAR NF
// =========================================================

function adicionar(chave) {

const dados =
    converter(chave);

if (!dados)
    return null;

ultimaUF =
    dados.uf;

ultimaNota =
    dados.nota;

if (!notas.includes(dados.nota)) {

    notas.push(
        dados.nota
    );

    console.log(
        "➕ NF adicionada:",
        dados.nota
    );

} else {

    console.log(
        "ℹ NF já estava na lista:",
        dados.nota
    );
}

salvar();

/*
 * AGORA É AUTOMÁTICO:
 *
 * assim que o scanner converter
 * a chave de 44 dígitos,
 * o campo de pesquisa recebe
 * imediatamente as NFs convertidas.
 */

preencherCampoPesquisa();

atualizarPainel();

return dados.nota;


}

// =========================================================
// ESPERAR ELEMENTO
// =========================================================

function esperar(
seletor,
tempo = 10000
) {

return new Promise(resolve => {

    const inicio =
        Date.now();

    const timer =
        setInterval(() => {

            const elemento =
                document.querySelector(
                    seletor
                );

            if (elemento) {

                clearInterval(timer);

                resolve(elemento);

                return;
            }

            if (
                Date.now() - inicio >
                tempo
            ) {

                clearInterval(timer);

                resolve(null);
            }

        }, 200);

});
}


// =========================================================
// STATUS
// =========================================================

function status(msg) {

if (painel) {

    const campo =
        painel.querySelector(
            "#pcpStatus"
        );

    if (campo)
        campo.textContent = msg;
}

console.log(msg);


}

// =========================================================
// ATUALIZAR PAINEL
// =========================================================

function atualizarPainel() {

if (!painel)
    return;

const uf =
    painel.querySelector("#pcpUF");

const ultima =
    painel.querySelector("#pcpUltima");

const qtd =
    painel.querySelector("#pcpQtd");

const listaCampo =
    painel.querySelector("#pcpLista");

const pesquisa =
    painel.querySelector("#pcpPesquisa");

if (uf)
    uf.textContent = ultimaUF;

if (ultima)
    ultima.textContent = ultimaNota;

if (qtd)
    qtd.textContent = notas.length;

if (
    listaCampo &&
    document.activeElement !== listaCampo
) {

    listaCampo.value =
        notas.join("\n");
}

if (pesquisa) {

    pesquisa.value =
        lista();
}

atualizarValoresNFe(
    valoresNFe
);


}

// =========================================================
// SINCRONIZAR TEXTAREA
// =========================================================

function sincronizarNotasDoPainel() {

if (!painel)
    return;

const campo =
    painel.querySelector(
        "#pcpLista"
    );

if (!campo)
    return;

const texto =
    campo.value.trim();

if (!texto) {

    notas = [];
    valoresNFe = {};

    localStorage.removeItem(
        STORAGE
    );

    localStorage.removeItem(
        STORAGE_VALORES
    );

    atualizarPainel();

    return;
}

const tokens =
    texto
        .split(/[\s,;]+/)
        .map(x => x.trim())
        .filter(Boolean);

const novasNotas = [];

tokens.forEach(token => {

    const somenteNumeros =
        token.replace(/\D/g, "");

    // Chave de acesso de 44 dígitos
    if (
        somenteNumeros.length === 44
    ) {

        const dados =
            converter(
                somenteNumeros
            );

        if (dados) {

            novasNotas.push(
                dados.nota
            );
        }

        return;
    }

    // NF digitada manualmente
    if (
        /^\d+$/.test(token)
    ) {

        const numero =
            String(
                parseInt(
                    token,
                    10
                )
            );

        if (
            numero &&
            numero !== "NaN"
        ) {

            novasNotas.push(
                numero
            );
        }
    }
});

notas =
    [...new Set(novasNotas)];

if (notas.length) {

    ultimaNota =
        notas[notas.length - 1];
}

const novoValores = {};

notas.forEach(nf => {

    if (
        Object.prototype.hasOwnProperty.call(
            valoresNFe,
            String(nf)
        )
    ) {

        novoValores[String(nf)] =
            valoresNFe[String(nf)];
    }
});

valoresNFe =
    novoValores;

localStorage.setItem(
    STORAGE,
    JSON.stringify(notas)
);

localStorage.setItem(
    STORAGE_VALORES,
    JSON.stringify(valoresNFe)
);

/*
 * Mantém o campo do site sincronizado
 * com as NFs convertidas.
 */

preencherCampoPesquisa();

atualizarPainel();


}

// =========================================================
// FIM DA PARTE 1
// =========================================================

// =========================================================
// CRIAR PAINEL
// =========================================================

function criarPainel() {

if (
    document.querySelector("#pcpEcold")
) {
    return;
}

painel =
    document.createElement("div");

painel.id =
    "pcpEcold";

painel.innerHTML = `

    <div id="pcpContainer"
    style="
        position:fixed;
        top:20px;
        right:20px;
        width:380px;
        max-height:90vh;
        overflow:auto;
        background:#111;
        color:white;
        padding:18px;
        border-radius:12px;
        z-index:999999;
        font-family:Arial,sans-serif;
        box-shadow:0 0 20px #000;
        border:2px solid #444;
    ">

        <h3 id="pcpMover"
        style="
            margin:0 0 15px;
            padding:10px;
            cursor:grab;
            background:#222;
            border-radius:8px;
            color:white;
            user-select:none;
        ">
            🚀 PCP e-Cold AUTO v4
        </h3>

        <b>UF:</b>
        <span id="pcpUF">--</span>

        <br><br>

        <b>Última NF:</b>
        <span id="pcpUltima">--</span>

        <br><br>

        <b>Quantidade:</b>
        <span id="pcpQtd">0</span>

        <hr>

        <!-- =================================================
             EMPRESA / CONSULTA
             ================================================= -->

        <b>🏢 Empresa da consulta:</b>

        <select
            id="pcpEmpresa"
            style="
                width:100%;
                margin-top:7px;
                background:#222;
                color:white;
                border:1px solid #555;
                padding:8px;
                border-radius:7px;
                box-sizing:border-box;
            "
        >

            <option value="auto">
                🤖 Automático pela NF
            </option>

            <option value="loja97">
                🏪 Grupo Fartura Loja 97
            </option>

            <option value="matriz">
                🏢 Grupo Fartura Matriz
            </option>

            <option value="flores">
                🌸 Flores - LJ133
            </option>


        </select>

        <div
            id="pcpEmpresaInfo"
            style="
                margin-top:6px;
                font-size:11px;
                color:#bbb;
            "
        >
            NF iniciando com 45 → Matriz.
            Demais → Loja 97.
        </div>

        <hr>

        <!-- =================================================
             VALORES
             ================================================= -->

        <b>💰 Valores NF-e:</b>

        <div
            id="pcpValores"
            style="
                background:#191919;
                padding:8px;
                border-radius:8px;
                color:white;
                font-size:12px;
                max-height:160px;
                overflow:auto;
                margin-top:6px;
                border:1px solid #333;
            "
        >
            Nenhuma NF encontrada.
        </div>

        <br>

        <b>Valor Total NF-es:</b>

        <span id="pcpValor">
            R$ 0,00
        </span>

        <hr>

        <!-- =================================================
             LISTA DE NF
             ================================================= -->

        <b>📝 NFs convertidas:</b>

        <textarea
            id="pcpLista"
            placeholder="Digite as NFs aqui, uma por linha..."
            style="
                width:100%;
                height:120px;
                background:#191919;
                color:white;
                border:1px solid #555;
                border-radius:8px;
                font-weight:bold;
                padding:10px;
                box-sizing:border-box;
                resize:vertical;
                margin-top:6px;
            "
        ></textarea>

        <br><br>

        <b>🔎 Campo usado na consulta:</b>

        <input
            id="pcpPesquisa"
            readonly
            style="
                width:100%;
                background:#191919;
                color:white;
                border:1px solid #555;
                padding:8px;
                border-radius:8px;
                font-weight:bold;
                box-sizing:border-box;
            "
        >

        <br><br>

        <!-- =================================================
             BOTÕES
             ================================================= -->

        <div
            style="
                display:flex;
                gap:6px;
                flex-wrap:wrap;
            "
        >

            <button
                id="btnCopiarLista"
                style="
                    background:#333;
                    color:white;
                    border:1px solid #555;
                    padding:8px;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                📋 Romaneio
            </button>

            <button
                id="btnCopiarEcold"
                style="
                    background:#333;
                    color:white;
                    border:1px solid #555;
                    padding:8px;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                📋 e-Cold
            </button>

            <button
                id="btnPesquisar"
                style="
                    background:#444;
                    color:white;
                    border:1px solid #777;
                    padding:8px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >
                🔍 Pesquisar
            </button>

            <button
                id="btnDownload"
                style="
                    background:#444;
                    color:white;
                    border:1px solid #777;
                    padding:8px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >
                🚀 Download
            </button>

            <button
                id="btnLimpar"
                style="
                    background:#333;
                    color:white;
                    border:1px solid #777;
                    padding:8px;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                🗑 Limpar
            </button>

        </div>

        <br>

        <div
            id="pcpStatus"
            style="
                background:#191919;
                padding:9px;
                border-radius:8px;
                color:#ddd;
                font-size:12px;
                border:1px solid #333;
            "
        >
            🔎 Aguardando...
        </div>

    </div>
`;

document.body.appendChild(
    painel
);

// =========================================================
// ARRASTAR PAINEL
// =========================================================

const titulo =
    painel.querySelector(
        "#pcpMover"
    );

const container =
    painel.querySelector(
        "#pcpContainer"
    );

let movendo = false;
let offsetX = 0;
let offsetY = 0;

titulo.addEventListener(
    "mousedown",
    e => {

        movendo = true;

        const rect =
            container.getBoundingClientRect();

        offsetX =
            e.clientX - rect.left;

        offsetY =
            e.clientY - rect.top;

        container.style.left =
            rect.left + "px";

        container.style.top =
            rect.top + "px";

        container.style.right =
            "auto";

        titulo.style.cursor =
            "grabbing";
    }
);

document.addEventListener(
    "mousemove",
    e => {

        if (!movendo)
            return;

        container.style.left =
            (
                e.clientX - offsetX
            ) + "px";

        container.style.top =
            (
                e.clientY - offsetY
            ) + "px";
    }
);

document.addEventListener(
    "mouseup",
    () => {

        movendo = false;

        titulo.style.cursor =
            "grab";
    }
);

// =========================================================
// COPIAR ROMANEIO
// =========================================================

painel.querySelector(
    "#btnCopiarLista"
).onclick = async () => {

    sincronizarNotasDoPainel();

    try {

        await navigator.clipboard.writeText(
            notas.join("\n")
        );

        status(
            "📋 Romaneio copiado!"
        );

    } catch (e) {

        status(
            "⚠ Não foi possível copiar."
        );
    }
};

// =========================================================
// COPIAR e-COLD
// =========================================================

painel.querySelector(
    "#btnCopiarEcold"
).onclick = async () => {

    sincronizarNotasDoPainel();

    try {

        await navigator.clipboard.writeText(
            lista()
        );

        status(
            "📋 Lista e-Cold copiada!"
        );

    } catch (e) {

        status(
            "⚠ Não foi possível copiar."
        );
    }
};

// =========================================================
// LIMPAR
// =========================================================

painel.querySelector(
    "#btnLimpar"
).onclick = () => {

    if (
        confirm(
            "Limpar todas as NFs e valores?"
        )
    ) {

        limpar();
    }
};

// =========================================================
// PESQUISAR
// =========================================================

painel.querySelector(
    "#btnPesquisar"
).onclick =
    pesquisar;

// =========================================================
// DOWNLOAD
// =========================================================

painel.querySelector(
    "#btnDownload"
).onclick = async () => {

    sincronizarNotasDoPainel();

    if (!notas.length) {

        alert(
            "Nenhuma NF informada."
        );

        return;
    }

    // =====================================================
    // PRIMEIRO: RESPEITAR A EMPRESA SELECIONADA NO PAINEL
    // =====================================================

    status(
        "🏢 Configurando empresa da consulta..."
    );

    const empresaOK =
        await escolherEmpresa();

    if (!empresaOK) {

        status(
            "⚠ Não foi possível selecionar a empresa."
        );

        return;
    }

    // Dá tempo para o e-Cold registrar a troca
    await new Promise(
        r => setTimeout(r, 700)
    );

    // =====================================================
    // GARANTIR QUE AS NFs ESTÃO NO CAMPO
    // =====================================================

    const campo =
        await esperar(
            "#IDE_NNF",
            5000
        );

    if (campo) {

        const listaPesquisa =
            lista();

        campo.focus();

        campo.value =
            listaPesquisa;

        campo.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles:true
                }
            )
        );

        campo.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:true
                }
            )
        );

        campo.dispatchEvent(
            new Event(
                "blur",
                {
                    bubbles:true
                }
            )
        );
    }

    // =====================================================
    // PESQUISAR NA EMPRESA SELECIONADA
    // =====================================================

    status(
        "🔎 Pesquisando na empresa selecionada..."
    );

    const botoes =
        [
            ...document.querySelectorAll(
                "button"
            )
        ];

    const btnPesquisar =
        botoes.find(
            b =>
                String(
                    b.innerText || ""
                )
                .trim()
                .toLowerCase()
                === "pesquisar"
        );

    if (btnPesquisar) {

        btnPesquisar.click();

    } else {

        const antigo =
            document.querySelector(
                "#buttonSubmit"
            );

        if (antigo) {

            antigo.click();

        } else {

            status(
                "⚠ Botão Pesquisar não encontrado."
            );

            return;
        }
    }

    // =====================================================
    // AGUARDAR RESULTADOS
    // =====================================================

    status(
        "⏳ Aguardando resultados..."
    );

    await new Promise(
        r => setTimeout(r, 1500)
    );

    // =====================================================
    // MARCAR TODOS
    // =====================================================

    await marcarTodos();

    await new Promise(
        r => setTimeout(r, 300)
    );

    // =====================================================
    // DOWNLOAD
    // =====================================================

    status(
        "⬇ Baixando documentos..."
    );

    await clicarDownload();
};

// =========================================================
// TROCA MANUAL DE EMPRESA
// =========================================================

painel.querySelector(
    "#pcpEmpresa"
).addEventListener(
    "change",
    () => {

        const valor =
            painel.querySelector(
                "#pcpEmpresa"
            ).value;

        if (
            valor === "matriz"
        ) {

            status(
                "🏢 Consulta configurada para MATRIZ."
            );

        } else if (
            valor === "loja97"
        ) {

            status(
                "🏪 Consulta configurada para LOJA 97."
            );

        } else {

            status(
                "🤖 Empresa automática."
            );
        }
    }
);

atualizarPainel();


}

// =========================================================
// DEFINIR EMPRESA
// =========================================================

function obterEmpresaSelecionada() {

if (!painel)
    return "auto";

const seletor =
    painel.querySelector(
        "#pcpEmpresa"
    );

if (!seletor)
    return "auto";

return seletor.value;


}

// =========================================================
// ESCOLHER EMPRESA PELO MODO
// =========================================================

async function escolherEmpresa() {

sincronizarNotasDoPainel();

if (!notas.length) {

    status(
        "⚠ Nenhuma NF para definir empresa."
    );

    return false;
}

const modo =
    obterEmpresaSelecionada();

let empresa = "";

// ---------------------------------------------------------
// MATRIZ FORÇADA
// ---------------------------------------------------------

if (
    modo === "matriz"
) {

empresa =
    "Grupo fartura hortifut Matriz LTDA NFE 2.00 Produção";
}

// ---------------------------------------------------------
// LOJA 97 FORÇADA
// ---------------------------------------------------------

else if (
    modo === "loja97"
) {

    empresa =
        "Grupo Fartura Hortifruti Loja 97 NFe 2.00 Produção";
}

// ---------------------------------------------------------
// LOJA 133 flores
// --

else if (
    modo === "flores"
) {

    empresa =
        "PD_NFE_COLD_FARTURA_LJ133";
}

// ---------------------------------------------------------
// AUTOMÁTICO
// ---------------------------------------------------------

else {

    const primeira =
        String(
            notas[0] || ""
        );

    /*
     * ATENÇÃO:
     *
     * Aqui mantemos a regra que você pediu:
     *
     * NF iniciando com 45 = MATRIZ
     * demais = LOJA 97
     */

if (
    primeira.startsWith("45")
) {

    empresa =
        "Grupo Fartura Hortifruti Matriz LTDA NFE 2.00 Produção";

} else if (
    primeira.startsWith("133")
) {

    empresa =
        "PD_NFE_COLD_FARTURA_LJ133";

} else {

    empresa =
        "Grupo Fartura Hortifruti Loja 97 NFe 2.00 Produção";
}
}

status(
    "🏢 Selecionando empresa..."
);

return await selecionarEmpresa(
    empresa
);


}

// =========================================================
// SELECIONAR EMPRESA NO CONSULTA DE DOCUMENTOS
// =========================================================

async function selecionarEmpresa(empresa) {

    const campo = await esperar(
        "#ddlApplication-input",
        10000
    );

    if (!campo) {

        status(
            "⚠ Campo Consulta de documentos não encontrado."
        );

        return false;
    }

    console.log(
        "🏢 Tentando selecionar:",
        empresa
    );

    status(
        "🏢 Abrindo Consulta de documentos..."
    );

    // =====================================================
    // ABRIR O COMBOBOX
    // =====================================================

    campo.focus();
    campo.click();

    const seta =
        campo.parentElement?.querySelector(
            ".t-select"
        );

    if (seta) {

        seta.click();

    }

    await new Promise(
        r => setTimeout(r, 500)
    );

    // =====================================================
    // PROCURAR EXATAMENTE O <li class="t-item">
    // =====================================================

    const itens =
        [
            ...document.querySelectorAll(
                "li.t-item"
            )
        ];

    console.log(
        "📋 Itens encontrados no ComboBox:",
        itens.map(
            li =>
                li.innerText.trim()
        )
    );

    const alvo =
        itens.find(
            li =>
                li.innerText
                    .trim()
                    .toLowerCase()
                    === empresa
                        .trim()
                        .toLowerCase()
        );

    if (!alvo) {

        console.log(
            "⚠ Empresa não encontrada na lista:",
            empresa
        );

        status(
            "⚠ Empresa não encontrada no Consulta de documentos."
        );

        return false;
    }

    console.log(
        "🎯 Empresa encontrada:",
        alvo.innerText.trim()
    );

    // =====================================================
    // CLICAR NA OPÇÃO REAL DO TELERIK
    // =====================================================

    alvo.scrollIntoView({
        block: "nearest"
    });

    alvo.click();

    await new Promise(
        r => setTimeout(r, 500)
    );

    // =====================================================
    // CONFIRMAR CAMPO VISUAL
    // =====================================================

    console.log(
        "🏢 Campo após seleção:",
        campo.value
    );

    // =====================================================
    // BLUR PARA O E-COLD REGISTRAR
    // =====================================================

    campo.dispatchEvent(
        new Event(
            "change",
            {
                bubbles: true
            }
        )
    );

    campo.blur();

    await new Promise(
        r => setTimeout(r, 300)
    );

    status(
        "✅ Empresa selecionada: " +
        campo.value
    );

    console.log(
        "✅ CONSULTA DE DOCUMENTOS CONFIGURADA:",
        campo.value
    );

    return true;
}
// =========================================================
// EMPRESA INICIAL
// =========================================================

async function selecionarEmpresaInicial() {

const campo =
    await esperar(
        "#ddlApplication-input",
        15000
    );

if (!campo) {

    console.log(
        "⚠ Campo empresa ainda não disponível."
    );

    return;
}

/*
 * Se já houver NF escaneada,
 * respeita o modo escolhido.
 *
 * Se ainda não houver,
 * usa Loja 97 como padrão.
 */

if (notas.length) {

    await escolherEmpresa();

    return;
}

await selecionarEmpresa(
    "Grupo Fartura Hortifruti Loja 97 NFe 2.00 Produção"
);

console.log(
    "🏪 Loja 97 configurada como padrão inicial."
);


}

// =========================================================
// FIM DA PARTE 2
// =========================================================

// =========================================================
// ENCONTRAR LINHA DA NF
// =========================================================

function encontrarLinhaNF(nf) {

const numero =
    String(nf);

const tabelas =
    [
        ...document.querySelectorAll("table")
    ];

for (const tabela of tabelas) {

    const linhas =
        [
            ...tabela.querySelectorAll("tr")
        ];

    for (const tr of linhas) {

        const texto =
            tr.innerText || "";

        const regex =
            new RegExp(
                "(^|\\D)" +
                numero +
                "(\\D|$)"
            );

        if (
            regex.test(texto)
        ) {

            return tr;
        }
    }
}

return null;


}

// =========================================================
// PARSE DE VALOR
// =========================================================

function parseValor(texto) {

texto =
    String(texto || "")
        .trim();

if (!texto)
    return NaN;

texto =
    texto
        .replace(/R\$/gi, "")
        .replace(/\s/g, "");

// Exemplo: 5.923,33
if (
    texto.includes(".") &&
    texto.includes(",")
) {

    texto =
        texto
            .replace(/\./g, "")
            .replace(",", ".");

}

// Exemplo: 5923,33
else if (
    texto.includes(",")
) {

    texto =
        texto.replace(
            ",",
            "."
        );
}

return parseFloat(texto);


}

// =========================================================
// PEGAR VALORES VISÍVEIS
// =========================================================

function obterValoresVisiveis() {

const elementos =
    [
        ...document.querySelectorAll(
            "div.fontAzul"
        )
    ];

const valores = [];

elementos.forEach(
    el => {

        const texto =
            String(
                el.textContent || ""
            ).trim();

        const valor =
            parseValor(texto);

        if (
            !isNaN(valor) &&
            valor > 0
        ) {

            valores.push(valor);
        }
    }
);

console.log(
    "💰 Valores visíveis:",
    valores
);

return valores;


}

// =========================================================
// VALOR DA NF ATUAL
// =========================================================

function obterValorNFAtual() {

const valores =
    obterValoresVisiveis();

if (!valores.length)
    return 0;

/*
 * Na tela da NF existem diversos valores.
 *
 * O maior valor visível normalmente
 * corresponde ao Valor Total dos Produtos.
 */

return Math.max(
    ...valores
);
}

// =========================================================
// ATUALIZAR VALORES NO PAINEL
// =========================================================

function atualizarValoresNFe(
valores
) {

valores =
    valores || {};

if (!painel)
    return;

const campoValores =
    painel.querySelector(
        "#pcpValores"
    );

const campoTotal =
    painel.querySelector(
        "#pcpValor"
    );

if (
    !campoValores ||
    !campoTotal
) {
    return;
}

let html = "";
let total = 0;

notas.forEach(
    nf => {

        const valor =
            Number(
                valores[
                    String(nf)
                ]
            );

        if (
            !isNaN(valor) &&
            valor > 0
        ) {

            total += valor;

            html += `
                <div style="
                    padding:5px 0;
                    border-bottom:1px solid #333;
                ">
                    <b>NF ${nf}</b>
                    -
                    R$
                    ${valor.toLocaleString(
                        "pt-BR",
                        {
                            minimumFractionDigits:2,
                            maximumFractionDigits:2
                        }
                    )}
                </div>
            `;

        } else {

            html += `
                <div style="
                    padding:5px 0;
                    border-bottom:1px solid #333;
                ">
                    <b>NF ${nf}</b>
                    -
                    <span style="opacity:.65">
                        valor não localizado
                    </span>
                </div>
            `;
        }
    }
);

campoValores.innerHTML =
    html ||
    "Nenhuma NF encontrada.";

campoTotal.textContent =
    "R$ " +
    total.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        }
    );

console.log(
    "💰 Valores:",
    valores
);

console.log(
    "💰 Total:",
    total
);


}

// =========================================================
// CALCULAR TOTAL
// =========================================================

function calcularValorTotal() {

let total = 0;

Object.values(
    valoresNFe
).forEach(
    valor => {

        const numero =
            Number(valor);

        if (
            !isNaN(numero) &&
            numero > 0
        ) {

            total += numero;
        }
    }
);

return total;


}

// =========================================================
// COLETAR VALORES DAS NFs — VERSÃO RÁPIDA + PAGINAÇÃO
// =========================================================

async function coletarValoresDasNotas() {

    sincronizarNotasDoPainel();

    if (!notas.length) {

        status(
            "⚠ Nenhuma NF para ler."
        );

        return {};
    }

    status(
        "💰 Lendo valores das NF-e..."
    );

    const encontrados = {};

    // =====================================================
    // LIMPAR VALORES ANTIGOS
    // =====================================================

    notas.forEach(nf => {

        delete valoresNFe[String(nf)];

    });

    atualizarValoresNFe(valoresNFe);

    // =====================================================
    // FUNÇÃO PARA AGUARDAR
    // =====================================================

    const esperarCurto = ms =>
        new Promise(resolve =>
            setTimeout(resolve, ms)
        );

    // =====================================================
    // ENCONTRAR PAGINAÇÃO
    // =====================================================

    function obterPaginas() {

        const paginas = [
            ...document.querySelectorAll(
                ".t-pager .t-state-active, " +
                ".t-pager a.t-link, " +
                ".t-numeric a, " +
                ".t-numeric span"
            )
        ];

        const numeros = paginas
            .map(el =>
                parseInt(
                    String(el.innerText || "").trim(),
                    10
                )
            )
            .filter(n => !isNaN(n));

        return [
            ...new Set(numeros)
        ].sort((a, b) => a - b);
    }

    // =====================================================
    // CLICAR EM UMA PÁGINA
    // =====================================================

    async function irParaPagina(numero) {

        const elementos = [
            ...document.querySelectorAll(
                ".t-pager a, " +
                ".t-pager span, " +
                ".t-numeric a, " +
                ".t-numeric span"
            )
        ];

        const alvo = elementos.find(el => {

            const texto =
                String(
                    el.innerText || ""
                ).trim();

            return texto === String(numero);

        });

        if (!alvo)
            return false;

        const ativo =
            alvo.classList.contains(
                "t-state-active"
            );

        if (ativo)
            return true;

        alvo.click();

        await esperarCurto(500);

        return true;
    }

    // =====================================================
    // LER NF ATUAL
    // =====================================================

 async function lerNF(nf) {

    const chaveNF = String(nf);

    // =====================================================
    // LOCALIZAR A LINHA DA NF
    // =====================================================

    const linha = encontrarLinhaNF(chaveNF);

    if (!linha) {

        console.log(
            "⚠ NF não encontrada na página:",
            chaveNF
        );

        return false;
    }

    // =====================================================
    // CLICAR DIRETAMENTE NA CÉLULA DA NF
    // =====================================================

    const celulas = [
        ...linha.querySelectorAll("td")
    ];

    const celula = celulas.find(td =>
        String(
            td.innerText || ""
        ).trim() === chaveNF
    );

    const alvo = celula || linha;

    alvo.click();

    // =====================================================
    // AGUARDAR A NF CARREGAR
    // =====================================================

    let valor = 0;

    await new Promise(
        resolve =>
            setTimeout(resolve, 500)
    );

    // =====================================================
    // LER O VALOR REAL DA NF
    // =====================================================

    for (
        let tentativa = 0;
        tentativa < 5;
        tentativa++
    ) {

        valor = obterValorNFAtual();

        console.log(
            "💰 Tentativa",
            tentativa + 1,
            "NF",
            chaveNF,
            "→",
            valor
        );

        if (
            valor &&
            valor > 0
        ) {
            break;
        }

        await new Promise(
            resolve =>
                setTimeout(resolve, 250)
        );
    }

    // =====================================================
    // VALOR ENCONTRADO
    // =====================================================

    if (
        valor &&
        valor > 0
    ) {

        encontrados[chaveNF] = valor;

        valoresNFe[chaveNF] = valor;

        localStorage.setItem(
            STORAGE_VALORES,
            JSON.stringify(valoresNFe)
        );

        atualizarValoresNFe(
            valoresNFe
        );

        console.log(
            "✅ Valor encontrado:",
            chaveNF,
            "→ R$",
            valor
        );

        return true;
    }

    // =====================================================
    // NÃO ENCONTROU
    // =====================================================

    console.log(
        "⚠ Valor não localizado:",
        chaveNF
    );

    return false;
}

    // =====================================================
    // PAGINAÇÃO
    // =====================================================

    let paginaAtual = 1;
    let ultimaPaginaProcessada = 0;

    while (
        Object.keys(encontrados).length <
            notas.length
    ) {

        // -----------------------------------------------
        // DESCOBRIR PÁGINAS DISPONÍVEIS
        // -----------------------------------------------

        const paginas =
            obterPaginas();

        console.log(
            "📄 Páginas encontradas:",
            paginas
        );

        // -----------------------------------------------
        // GARANTIR PÁGINA ATUAL
        // -----------------------------------------------

        if (
            paginaAtual !== ultimaPaginaProcessada
        ) {

            await irParaPagina(
                paginaAtual
            );

            ultimaPaginaProcessada =
                paginaAtual;

            await esperarCurto(400);
        }

        // -----------------------------------------------
        // NFs EXISTENTES NESSA PÁGINA
        // -----------------------------------------------

        const nfsDaPagina =
            notas.filter(nf =>
                encontrarLinhaNF(nf)
            );

        console.log(
            "📄 Página",
            paginaAtual,
            "NFs:",
            nfsDaPagina
        );

        // -----------------------------------------------
        // LER NFs DA PÁGINA
        // -----------------------------------------------

        for (
            const nf of nfsDaPagina
        ) {

            if (
                encontrados[
                    String(nf)
                ]
            ) {
                continue;
            }

            status(
                "🔎 Lendo NF " +
                nf +
                " (" +
                Object.keys(encontrados).length +
                "/" +
                notas.length +
                ")..."
            );

            await lerNF(nf);

            // Pequena pausa
            await esperarCurto(150);
        }

        // -----------------------------------------------
        // VERIFICAR SE TERMINOU
        // -----------------------------------------------

        if (
            Object.keys(encontrados).length >=
            notas.length
        ) {

            break;
        }

        // -----------------------------------------------
        // DESCOBRIR PRÓXIMA PÁGINA
        // -----------------------------------------------

        const paginasDepois =
            obterPaginas();

        const proximaPagina =
            paginasDepois.find(
                n => n > paginaAtual
            );

        if (
            proximaPagina
        ) {

            paginaAtual =
                proximaPagina;

            continue;
        }

        // -----------------------------------------------
        // TENTAR BOTÃO NEXT
        // -----------------------------------------------

        const next =
            document.querySelector(
                ".t-pager .t-arrow-next"
            );

        if (
            next &&
            next.closest("a") &&
            !next.closest("a")
                .classList.contains(
                    "t-state-disabled"
                )
        ) {

            next.closest("a").click();

            await esperarCurto(600);

            paginaAtual++;

            ultimaPaginaProcessada = 0;

            continue;
        }

        // -----------------------------------------------
        // NÃO TEM MAIS PÁGINAS
        // -----------------------------------------------

        break;
    }

    // =====================================================
    // RESULTADO FINAL
    // =====================================================

    atualizarValoresNFe(
        valoresNFe
    );

    const total =
        calcularValorTotal();

    const quantidadeEncontrada =
        Object.keys(encontrados).length;

    status(
        "✅ Leitura concluída: " +
        quantidadeEncontrada +
        "/" +
        notas.length +
        " NF-es | Total: R$ " +
        total.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

    console.log(
        "📊 NFs encontradas:",
        quantidadeEncontrada,
        "/",
        notas.length
    );

    console.log(
        "💰 Valores encontrados:",
        encontrados
    );

    console.log(
        "💰 Total:",
        total
    );

    return encontrados;
}

// =========================================================
// PESQUISAR
// =========================================================

async function pesquisar() {

    sincronizarNotasDoPainel();

    if (!notas.length) {

        alert(
            "Nenhuma NF informada."
        );

        return false;
    }

    // =====================================================
    // PRIMEIRO: RESPEITAR A EMPRESA SELECIONADA NO PAINEL
    // =====================================================

    status(
        "🏢 Configurando empresa da consulta..."
    );

    const empresaOK =
        await escolherEmpresa();

    if (!empresaOK) {

        status(
            "⚠ Não foi possível selecionar a empresa."
        );

        return false;
    }

    // Dá tempo para o e-Cold registrar a troca
    await new Promise(
        r => setTimeout(r, 700)
    );

    // =====================================================
    // GARANTIR CAMPO DAS NFs
    // =====================================================

    const campo =
        await esperar(
            "#IDE_NNF",
            5000
        );

    if (!campo) {

        alert(
            "Campo Número da Nota não encontrado."
        );

        return false;
    }

    status(
        "🔎 Enviando NFs para pesquisa..."
    );

    const listaPesquisa =
        lista();

    campo.focus();

    campo.value =
        listaPesquisa;

    campo.dispatchEvent(
        new Event(
            "input",
            {
                bubbles:true
            }
        )
    );

    campo.dispatchEvent(
        new Event(
            "change",
            {
                bubbles:true
            }
        )
    );

    campo.dispatchEvent(
        new Event(
            "blur",
            {
                bubbles:true
            }
        )
    );

    console.log(
        "🔎 PESQUISA:",
        listaPesquisa
    );

    console.log(
        "🏢 EMPRESA SELECIONADA:",
        obterEmpresaSelecionada()
    );

    // =====================================================
    // CLICAR PESQUISAR
    // =====================================================

    const botoes =
        [
            ...document.querySelectorAll(
                "button"
            )
        ];

    const btn =
        botoes.find(
            b =>
                String(
                    b.innerText || ""
                )
                .trim()
                .toLowerCase()
                === "pesquisar"
        );

    if (btn) {

        btn.click();

    } else {

        const antigo =
            document.querySelector(
                "#buttonSubmit"
            );

        if (antigo) {

            antigo.click();

        } else {

            console.log(
                "⚠ Botão Pesquisar não encontrado."
            );
        }
    }

    status(
        "⏳ Aguardando resultados..."
    );

    // =====================================================
    // ESPERAR RESULTADOS
    // =====================================================

    let tentativas = 0;

    while (
        tentativas < 30
    ) {

        tentativas++;

        await new Promise(
            r =>
                setTimeout(
                    r,
                    500
                )
        );

        const linhas =
            [
                ...document.querySelectorAll(
                    "tr"
                )
            ];

        const encontrou =
            notas.some(
                nf =>
                    linhas.some(
                        tr =>
                            (
                                tr.innerText ||
                                ""
                            ).match(
                                new RegExp(
                                    "(^|\\D)" +
                                    nf +
                                    "(\\D|$)"
                                )
                            )
                    )
            );

        if (encontrou) {

            status(
                "✅ Notas encontradas. Lendo valores..."
            );

            await new Promise(
                r =>
                    setTimeout(
                        r,
                        1000
                    )
            );

            await coletarValoresDasNotas();

            return true;
        }
    }

    status(
        "⚠ Pesquisa concluída. Resultados não confirmados."
    );

    await coletarValoresDasNotas();

    return true;
}
// =========================================================
// MARCAR TODOS
// =========================================================

async function marcarTodos() {

status(
    "☑ Selecionando documentos..."
);

const checkAll =
    document.querySelector(
        'input[name="checkAll"]'
    );

if (checkAll) {

    if (
        !checkAll.checked
    ) {

        checkAll.click();
    }

    await new Promise(
        r =>
            setTimeout(
                r,
                500
            )
    );

    console.log(
        "✅ Check geral marcado."
    );

    return true;
}

const tabelas =
    [
        ...document.querySelectorAll(
            "table"
        )
    ];

const tabela =
    tabelas.find(
        t =>
            (
                t.innerText || ""
            ).includes("NF")
    );

if (tabela) {

    const checks =
        [
            ...tabela.querySelectorAll(
                'input[type="checkbox"]'
            )
        ];

    checks.forEach(
        checkbox => {

            if (
                !checkbox.checked
            ) {

                checkbox.click();
            }
        }
    );

    if (checks.length) {

        console.log(
            "✅ Documentos marcados:",
            checks.length
        );

        return true;
    }
}

console.log(
    "⚠ Nenhum checkbox encontrado."
);

return false;


}

// =========================================================
// ABRIR DOWNLOAD + CONFIGURAR + CONCLUIR
// =========================================================

async function clicarDownload() {

    status(
        "⬇ Abrindo Download..."
    );

    const botao =
        document.querySelector(
            "#actionDownload"
        );

    if (!botao) {

        console.log(
            "⚠ Botão Download não encontrado."
        );

        status(
            "⚠ Botão Download não encontrado."
        );

        return false;
    }

    // =====================================================
    // ABRIR DOWNLOAD
    // =====================================================

    botao.click();

    status(
        "⏳ Abrindo opções de Download..."
    );

    // Esperar a tela abrir
    const campoNome =
        await esperar(
            "#txtRequestName",
            10000
        );

    if (!campoNome) {

        console.log(
            "⚠ Tela de Download não abriu."
        );

        status(
            "⚠ Tela de Download não encontrada."
        );

        return false;
    }

    // =====================================================
    // AUTORIZAÇÃO DE USO (procNFe)
    // =====================================================

    const chkProc =
        document.querySelector(
            "#chkProc"
        );

    if (!chkProc) {

        console.log(
            "⚠ #chkProc não encontrado."
        );

        status(
            "⚠ Autorização de uso não encontrada."
        );

        return false;
    }

    if (!chkProc.checked) {

        chkProc.click();

        console.log(
            "✅ Autorização de uso selecionada."
        );
    }

    // =====================================================
    // ESPERAR NAMESPACE SIMPLIFICADO
    // =====================================================

    status(
        "⏳ Liberando Namespace Simplificado..."
    );

    let chkSimplificado = null;

    const inicio =
        Date.now();

    while (
        Date.now() - inicio < 5000
    ) {

        chkSimplificado =
            document.querySelector(
                "#chkSimplifiedHeader1"
            );

        if (
            chkSimplificado &&
            !chkSimplificado.disabled
        ) {

            break;
        }

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );
    }

    if (
        !chkSimplificado
    ) {

        console.log(
            "⚠ Namespace Simplificado não encontrado."
        );

        status(
            "⚠ Namespace Simplificado não encontrado."
        );

        return false;
    }

    if (
        chkSimplificado.disabled
    ) {

        console.log(
            "⚠ Namespace Simplificado continua desabilitado."
        );

        status(
            "⚠ Namespace Simplificado não foi liberado."
        );

        return false;
    }

    // =====================================================
    // MARCAR NAMESPACE SIMPLIFICADO
    // =====================================================

    if (
        !chkSimplificado.checked
    ) {

        chkSimplificado.click();

        console.log(
            "✅ Namespace Simplificado selecionado."
        );
    }

    // =====================================================
    // IDENTIFIQUE SUA SOLICITAÇÃO
    // =====================================================

    status(
        "📝 Preenchendo identificação..."
    );

    const nome =
        "TRANSPORTE T3";

    campoNome.focus();

    const setter =
        Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
        ).set;

    setter.call(
        campoNome,
        nome
    );

    campoNome.dispatchEvent(
        new Event(
            "input",
            {
                bubbles: true
            }
        )
    );

    campoNome.dispatchEvent(
        new Event(
            "change",
            {
                bubbles: true
            }
        )
    );

    console.log(
        "✅ Identificação:",
        campoNome.value
    );

    // =====================================================
    // CONFERÊNCIA
    // =====================================================

// Dar tempo para o e-Cold reconhecer a identificação
await new Promise(
    resolve =>
        setTimeout(
            resolve,
            1000
        )
);

console.log(
    "📝 Identificação antes do Concluir:",
    campoNome.value
);

    console.log(
        "📦 DOWNLOAD CONFIGURADO:"
    );

    console.log(
        "procNFe:",
        chkProc.checked
    );

    console.log(
        "Namespace Simplificado:",
        chkSimplificado.checked
    );

    console.log(
        "Nome:",
        campoNome.value
    );

    // =====================================================
    // CLICAR CONCLUIR
    // =====================================================

    const btnConcluir =
        await esperar(
            "#btnConcluir",
            5000
        );

    if (!btnConcluir) {

        console.log(
            "⚠ Botão Concluir não encontrado."
        );

        status(
            "⚠ Botão Concluir não encontrado."
        );

        return false;
    }

    status(
        "🚀 Clicando em CONCLUIR..."
    );

    btnConcluir.scrollIntoView({
        block: "center",
        behavior: "instant"
    });

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                300
            )
    );

    btnConcluir.focus();

    btnConcluir.click();

    console.log(
        "✅ CONCLUIR CLICADO!"
    );

    status(
        "✅ Solicitação de Download enviada!"
    );

    return true;
}

// =========================================================
// FIM DA PARTE 3
// =========================================================

// =========================================================
// SCANNER + CONVERSOR AUTOMÁTICO DA CHAVE DE ACESSO
// =========================================================

function iniciarScanner() {

    let bufferScanner = "";
    let ultimoTempo = 0;

    document.addEventListener("keydown", function (e) {

        const agora = Date.now();

        // Se demorou muito entre teclas, começa uma nova leitura
        if (agora - ultimoTempo > 300) {
            bufferScanner = "";
        }

        ultimoTempo = agora;

        // ENTER = fim da leitura
        if (e.key === "Enter") {

            const chave = bufferScanner.replace(/\D/g, "");

            console.log("📷 SCANNER FINALIZOU:");
            console.log("🔢 Chave:", chave);
            console.log("📏 Tamanho:", chave.length);

            if (chave.length === 44) {

                const dados = converter(chave);

                if (dados) {

                    console.log(
                        "✅ CHAVE CONVERTIDA:",
                        dados.nota,
                        "UF:",
                        dados.uf
                    );

                    adicionar(chave);

                    const campo =
                        document.querySelector("#IDE_NNF");

                    if (campo) {

                        const valor =
                            notas.join(";");

                        const setter =
                            Object.getOwnPropertyDescriptor(
                                HTMLInputElement.prototype,
                                "value"
                            ).set;

                        setter.call(campo, valor);

                        campo.dispatchEvent(
                            new Event("input", {
                                bubbles: true
                            })
                        );

                        campo.dispatchEvent(
                            new Event("change", {
                                bubbles: true
                            })
                        );

                        console.log(
                            "📝 #IDE_NNF:",
                            campo.value
                        );
                    }

                    status(
                        "✅ NF " +
                        dados.nota +
                        " convertida automaticamente."
                    );

                    atualizarPainel();
                }

            } else {

                console.log(
                    "⚠ Scanner não enviou 44 dígitos:",
                    chave.length
                );
            }

            bufferScanner = "";

            return;
        }

        // Captura somente números
        if (/^[0-9]$/.test(e.key)) {

            bufferScanner += e.key;

            console.log(
                "📥 Scanner:",
                e.key,
                "| Buffer:",
                bufferScanner.length
            );
        }

    }, true);

    console.log(
        "📡 Scanner NF-e ativado."
    );
}

// =========================================================
// AUTO-CONVERSÃO DO CAMPO DE PESQUISA
// =========================================================



// =========================================================
// OBSERVAR #IDE_NNF E CONVERTER CHAVE AUTOMATICAMENTE
// =========================================================

let conversaoEmAndamento = false;
let ultimoProcessado = "";

function colocarValor(campo, valor) {

    const setter =
        Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
        ).set;

    setter.call(campo, String(valor));

    campo.dispatchEvent(
        new Event("input", {
            bubbles: true
        })
    );

    campo.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );
}

function observarCampoPesquisa() {

    const iniciar = () => {

        const campo =
            document.querySelector("#IDE_NNF");

        if (!campo) {
            setTimeout(iniciar, 500);
            return;
        }

        console.log(
            "👀 Monitorando #IDE_NNF"
        );

        const verificar = () => {

            if (conversaoEmAndamento)
                return;

            const valor =
                String(campo.value || "")
                    .replace(/\D/g, "");

            if (valor.length !== 44)
                return;

            if (valor === ultimoProcessado)
                return;

            ultimoProcessado = valor;
            conversaoEmAndamento = true;

            console.log(
                "🔎 Chave de 44 dígitos detectada no #IDE_NNF:",
                valor
            );

            const dados =
                converter(valor);

            if (dados) {

                adicionar(valor);

                console.log(
                    "✅ #IDE_NNF convertido automaticamente:",
                    dados.nota
                );

                status(
                    "✅ NF " +
                    dados.nota +
                    " convertida automaticamente."
                );
            }

            setTimeout(() => {
                conversaoEmAndamento = false;
            }, 100);
        };

        campo.addEventListener(
            "input",
            verificar
        );

        campo.addEventListener(
            "change",
            verificar
        );

        verificar();
    };

    iniciar();
}


// =========================================================
// INICIAR SISTEMA
// =========================================================

function iniciarSistema() {

console.log("🚨 PCP INICIARSISTEMA EXECUTOU");

if (
    document.querySelector(
        "#pcpEcold"
    )
) {

    return;
}

/*
 * Cria o painel.
 */

criarPainel();


/*
 * Ativa o scanner de código de acesso.
 */

iniciarScanner();


/*
 * Procura o campo de pesquisa e instala
 * o conversor automático.
 */

observarCampoPesquisa();


/*
 * Aguarda o sistema carregar antes de
 * selecionar a empresa inicial.
 */

setTimeout(
    () => {

        selecionarEmpresaInicial();

    },
    1500
);


console.log(
    "🚀 PCP e-Cold AUTO v3.3 iniciado."
);


}

// =========================================================
// INICIALIZAÇÃO
// =========================================================

if (
document.readyState ===
"loading"
) {

document.addEventListener(
    "DOMContentLoaded",
    iniciarSistema
);


} else {

iniciarSistema();


}

})();

// Sintetizador de Voz Nativo do Navegador
const synth = window.speechSynthesis;
let faladoAtualmente = null;

function checarEnter(event) {
    if (event.key === "Enter") {
        buscarComDuckDuckGo();
    }
}

function preencherEBuscar(texto) {
    document.getElementById("perguntaInput").value = texto;
    buscarComDuckDuckGo();
}

// Integração direta com DuckDuckGo via JSONP + Wikipedia API
async function buscarComDuckDuckGo() {
    const input = document.getElementById("perguntaInput");
    const pergunta = input.value.trim();

    if (!pergunta) {
        alert("Por favor, digite uma pergunta sobre música!");
        return;
    }

    pararVoz();

    const loading = document.getElementById("loading");
    const respostaContainer = document.getElementById("respostaContainer");
    const textoResposta = document.getElementById("textoResposta");
    const noticiaConteudo = document.getElementById("noticiaConteudo");

    respostaContainer.classList.add("hidden");
    loading.classList.remove("hidden");

    const termoBusca = pergunta.toLowerCase().includes("música") || pergunta.toLowerCase().includes("musica")
        ? pergunta 
        : `${pergunta} música`;

    try {
        // 1. Consulta à API Instant Answer do DuckDuckGo
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(termoBusca)}&format=json&no_html=1&skip_disambig=1`;
        const ddgRes = await fetch(ddgUrl);
        const ddgData = await ddgRes.json();

        let respostaTexto = "";
        let detalhesNoticia = "";

        if (ddgData.AbstractText) {
            respostaTexto = ddgData.AbstractText;
            if (ddgData.AbstractSource) {
                detalhesNoticia = `<strong>Fonte DuckDuckGo (${ddgData.AbstractSource}):</strong> ${ddgData.AbstractText}`;
            }
        } else if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
            // Se houver tópicos relacionados no DuckDuckGo
            const topicos = ddgData.RelatedTopics.filter(t => t.Text).slice(0, 3);
            if (topicos.length > 0) {
                respostaTexto = topicos[0].Text;
                detalhesNoticia = topicos.map(t => `<div class="related-topic-item">• ${t.Text}</div>`).join('');
            }
        }

        // 2. Se o DuckDuckGo não retornar resumo direto, realiza busca na Wikipedia em Português
        if (!respostaTexto) {
            const wikiUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termoBusca)}`;
            const wikiRes = await fetch(wikiUrl);
            
            if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                if (wikiData.extract) {
                    respostaTexto = wikiData.extract;
                    detalhesNoticia = `<strong>Resumo extraído:</strong> ${wikiData.description || 'Informação sobre ' + pergunta}`;
                }
            }
        }

        // Exibe os resultados diretamente na página
        if (respostaTexto) {
            textoResposta.innerHTML = `<p>${respostaTexto}</p>`;
            noticiaConteudo.innerHTML = detalhesNoticia || `Informações encontradas diretamente na rede DuckDuckGo para "${pergunta}".`;
        } else {
            textoResposta.innerHTML = `<p>Busca concluída para: <strong>"${pergunta}"</strong>. Não foi encontrado um resumo direto no DuckDuckGo, mas você pode refinar sua pergunta especificando nomes de artistas, gêneros ou canções.</p>`;
            noticiaConteudo.innerHTML = `<em>Dica: Tente termos como "Origem do Rock", "Quem é Beyoncé" ou "História do Jazz".</em>`;
        }

    } catch (error) {
        console.error("Erro na busca de dados:", error);
        textoResposta.innerText = `Ocorreu um erro ao conectar à rede de busca do DuckDuckGo. Verifique sua conexão.`;
        noticiaConteudo.innerText = "Não foi possível carregar os detalhes inline.";
    } finally {
        loading.classList.add("hidden");
        respostaContainer.classList.remove("hidden");
    }
}

// Leitura por Voz (Web Speech API)
function alternarVoz() {
    if (synth.speaking) {
        pararVoz();
    } else {
        iniciarVoz();
    }
}

function iniciarVoz() {
    const texto = document.getElementById("textoResposta").innerText;
    if (!texto) return;

    faladoAtualmente = new SpeechSynthesisUtterance(texto);
    faladoAtualmente.lang = 'pt-BR';
    faladoAtualmente.rate = 1.0;

    const textoBtnVoz = document.getElementById("textoBtnVoz");

    faladoAtualmente.onstart = () => {
        textoBtnVoz.innerText = "Pausar Leitura";
    };

    faladoAtualmente.onend = () => {
        textoBtnVoz.innerText = "Ouvir Resposta";
    };

    synth.speak(faladoAtualmente);
}

function pararVoz() {
    if (synth.speaking) {
        synth.cancel();
        const textoBtnVoz = document.getElementById("textoBtnVoz");
        if (textoBtnVoz) {
            textoBtnVoz.innerText = "Ouvir Resposta";
        }
    }
}
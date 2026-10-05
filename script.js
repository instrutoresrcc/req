/* =====================================================================
   [INS] Requerimentos — script único
   (formulários + Firebase + painel de gestão + iframe do post + selo)
   ===================================================================== */
let activeForm = null, isUserLoggedIn = false, currentUser = null, usuarioLogado = null, subgruposSelecionados = [], firebaseDb = null;

/* Modo selo: /h5-teste?status=REQ07 -> a página mostra só o veredito (usado no iframe dos posts) */
const INS_STATUS_ID = (function () {
    try {
        const q = new URLSearchParams(location.search).get('status');
        return q && /^[A-Za-z0-9_-]{1,40}$/.test(q) ? q : null;
    } catch (e) { return null; }
})();

const formTitles = {
    form1: "Entrada de membros", form2: "Expulsao", form3: "Licenca/Reserva", form4: "Promocao",
    form5: "Rebaixamento", form6: "Saida", form7: "Prolongamento de licenca", form8: "Retorno de licenca",
    form9: "Migracao de corpo", form10: "Transferencia de conta", form11: "Reintegracao",
    form12: "Atualizacao da listagem", form13: "Observacao/Advertencia", form14: "Capacitacao"
};
const formIcons = {
    form1: "fa-solid fa-user-plus", form2: "fa-solid fa-ban", form3: "fa-solid fa-calendar-days",
    form4: "fa-solid fa-arrow-up", form5: "fa-solid fa-arrow-down", form6: "fa-solid fa-right-from-bracket",
    form7: "fa-solid fa-clock-rotate-left", form8: "fa-solid fa-rotate-left", form9: "fa-solid fa-right-left",
    form10: "fa-solid fa-retweet", form11: "fa-solid fa-rotate-left", form12: "fa-solid fa-list",
    form13: "fa-solid fa-triangle-exclamation", form14: "fa-solid fa-graduation-cap"
};

function toggleForm(formId) {
    const newForm = document.getElementById(formId);
    document.getElementById('emptyState').style.display = 'none';
    if (activeForm && activeForm !== newForm) activeForm.classList.remove('active');
    newForm.classList.add('active');
    activeForm = newForm;
    document.getElementById('tituloFormAtivo').textContent = formTitles[formId];
    document.getElementById('iconFormAtivo').className = formIcons[formId] || 'fa-solid fa-clipboard-list';
    document.querySelectorAll('.req-nav-list li').forEach(li => li.classList.remove('active'));
    const activeLi = document.querySelector('.req-nav-list li[data-form="' + formId + '"]');
    if (activeLi) activeLi.classList.add('active');
    const panelButton = document.getElementById('navPainel');
    if (panelButton) panelButton.classList.toggle('active', formId === 'painel');
    const mobileSelect = document.getElementById('reqSelectMobile');
    if (mobileSelect) mobileSelect.value = mobileSelect.querySelector('option[value="' + formId + '"]') ? formId : '';
}

function esconderLoader() {
    const loader = document.getElementById('loader');
    if (!loader || loader.dataset.done) return;
    loader.dataset.done = '1';
    loader.classList.add('fade-out');
    setTimeout(function () { loader.style.display = 'none'; }, 500);
}
window.addEventListener('load', function () { setTimeout(esconderLoader, 500); });
setTimeout(esconderLoader, 6000); /* garantia: nunca fica preso no carregamento */

function showToast(title, message, tipo) {
    tipo = tipo || 'ok';
    const t = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    t.className = 'toast ' + tipo + ' show';
    const ic = t.querySelector('.toast-ic i');
    if (ic) ic.className = tipo === 'ok' ? 'fas fa-check' : tipo === 'err' ? 'fas fa-times' : 'fas fa-info';
    setTimeout(() => t.classList.remove('show'), 3200);
}

document.querySelectorAll('.subgrupo').forEach(el => {
    el.addEventListener('click', function () {
        const threadId = this.getAttribute('data-thread');
        const label = this.getAttribute('data-label');
        const formId = this.closest('.req-form').id;
        const permissoesContainer = formId === 'form3' ? document.getElementById('subgruposPermissoes') :
            formId === 'form7' ? document.getElementById('subgruposPermissoesForm7') : null;
        this.classList.toggle('selected');
        if (this.classList.contains('selected')) {
            subgruposSelecionados.push({ threadId, label });
            if (permissoesContainer) {
                const input = document.createElement('input');
                input.type = 'text'; input.placeholder = 'Permissao (' + label + ')';
                input.classList.add('subgruposPermissaoInput'); input.dataset.thread = threadId;
                permissoesContainer.appendChild(input);
            }
        } else {
            subgruposSelecionados = subgruposSelecionados.filter(sg => sg.threadId !== threadId);
            if (permissoesContainer) {
                const inputToRemove = permissoesContainer.querySelector('input[data-thread="' + threadId + '"]');
                if (inputToRemove) inputToRemove.remove();
            }
        }
    });
});

function retorna_horario() {
    const horario = new Date();
    horario.setMinutes(horario.getMinutes() + horario.getTimezoneOffset() - 180);
    let data_hoje = horario.getDate();
    if (data_hoje < 10) data_hoje = "0" + data_hoje;
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return data_hoje + "/" + meses[horario.getMonth()] + "/" + horario.getFullYear();
}
document.querySelectorAll(".data_hour").forEach(e => e.value = retorna_horario());

const firebaseConfig = {
    apiKey: "AIzaSyCQi2r4RNyKlIUypvWvOkQpiMVas-kUpfs",
    authDomain: "ins-requerimentos.firebaseapp.com",
    databaseURL: "https://ins-requerimentos-default-rtdb.firebaseio.com",
    projectId: "ins-requerimentos",
    storageBucket: "ins-requerimentos.firebasestorage.app",
    messagingSenderId: "703707522835",
    appId: "1:703707522835:web:5b191895953a9b2dda5ce6"
};

/* ---------------- tema ---------------- */
function aplicarTema(t) {
    document.documentElement.setAttribute("data-theme", t);
    const ic = document.getElementById("themeIcon"), lb = document.getElementById("themeLabel");
    if (ic) ic.className = t === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    if (lb) lb.textContent = t === "dark" ? "Tema claro" : "Tema escuro";
    try { localStorage.setItem("ins_tema", t); } catch (e) { }
}
function toggleTheme() {
    aplicarTema(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
(function () {
    let t = null;
    try { t = localStorage.getItem("ins_tema"); } catch (e) { }
    if (!t) t = (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    document.addEventListener("DOMContentLoaded", function () { aplicarTema(t); });
})();

/* ---------------- usuário ---------------- */
async function pegarUsername() {
    try {
        let resposta = await fetch("/forum");
        let html = await resposta.text();
        let regex = /_userdata\["username"\]\s*=\s*"([^"]+)"/;
        let match = html.match(regex);
        if (match && match[1] && match[1] !== 'null' && match[1] !== '' && match[1].toLowerCase() !== 'anonymous') {
            isUserLoggedIn = true; currentUser = match[1]; usuarioLogado = match[1];
            return match[1];
        } else { isUserLoggedIn = false; return null; }
    } catch (err) { isUserLoggedIn = false; return null; }
}

async function montarBarraUsuario() {
    if (INS_STATUS_ID) return;
    const nick = await pegarUsername();
    const nickEl = document.getElementById("userNick");
    const avEl = document.getElementById("userAvatar");
    if (!nickEl || !avEl) return;
    if (nick) {
        nickEl.textContent = nick;
        nickEl.classList.remove("off");
        avEl.src = "https://www.habbo.com.br/habbo-imaging/avatarimage?user=" + encodeURIComponent(nick) + "&action=std&direction=2&head_direction=3&gesture=sml&size=m";
        avEl.alt = "Habbo de " + nick;
    } else {
        nickEl.textContent = "Visitante";
        nickEl.classList.add("off");
        avEl.src = "https://www.habbo.com.br/habbo-imaging/avatarimage?user=&action=std&direction=2&head_direction=3&size=m";
        avEl.alt = "Avatar";
    }
}
document.addEventListener("DOMContentLoaded", montarBarraUsuario);

try {
    if (window.firebase && firebaseConfig.apiKey !== "SUA_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        firebaseDb = firebase.database();
    }
} catch (e) { }

function fmtDataBR(d) {
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

/* ---------------- dados estruturados do requerimento ---------------- */
function extrairDadosEstruturados(formId, formEl) {
    const getVal = sel => { const el = formEl.querySelector(sel); return el ? el.value.trim() : ""; };
    const getSelectVal = sel => { const el = formEl.querySelector(sel); return el ? el.value : ""; };
    const getSubgrupos = comPerm => Array.from(formEl.querySelectorAll('.subgrupo.selected')).map(sg => {
        const o = { label: sg.getAttribute('data-label') };
        if (comPerm) {
            const inp = formEl.querySelector('input[data-thread="' + sg.getAttribute('data-thread') + '"]');
            o.permissao = inp ? inp.value.trim() : "";
        }
        return o;
    });
    const getPeriodo = dias => { const ini = new Date(), fim = new Date(); fim.setDate(ini.getDate() + dias); return { inicio: fmtDataBR(ini), fim: fmtDataBR(fim) }; };
    const getData = sel => { const v = getVal(sel); if (!v) return ""; const p = v.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
    const getTermos = () => { const c = formEl.querySelector('input[type="checkbox"]'); return c && c.checked ? c.nextElementSibling.innerText.trim() : ""; };

    let dados = { nicknames: [], dataRegistro: retorna_horario() };
    switch (formId) {
        case "form1": dados.nicknames = getVal('input[name="nick_ent"]').split("/").map(s => s.trim()).filter(Boolean); dados.cargoResultante = "Instrutor"; dados.observacao = "Necessário adicionar em ambos"; break;
        case "form2": dados.nicknames = [getVal('input[name="TAG_ex"]')]; dados.cargoAnterior = getSelectVal('select[name="cargo_ex"]'); dados.motivo = getVal('input[name="motivo_ex"]'); dados.permissao = getVal('input[name="perm_ex"]'); break;
        case "form3": case "form7": {
            dados.nicknames = [getVal('input[placeholder="Nickname"]')];
            const diasEl = formEl.querySelector('input[type="number"]');
            dados.dias = diasEl && diasEl.value.trim() !== "" ? parseInt(diasEl.value.trim(), 10) : null;
            if (dados.dias) dados.periodo = getPeriodo(dados.dias);
            dados.permissaoCompanhia = getVal('input[name="permissaoCompanhia"]');
            dados.subgrupos = getSubgrupos(true);
            if (formId === "form3") dados.termosAceitos = getTermos();
            break;
        }
        case "form4": dados.nicknames = [getVal('input[name="nick_pro"]')]; dados.cargoAnterior = getSelectVal('select[name="cargo_pro"]'); dados.cargoNovo = getSelectVal('select[name="cargo_pro2"]'); dados.motivo = getVal('input[name="motivo_pro"]'); dados.data = getData('input[name="data_pro"]'); break;
        case "form5": dados.nicknames = [getVal('input[name="nick_reb"]')]; dados.cargoAnterior = getSelectVal('select[name="cargo_reb"]'); dados.cargoNovo = getSelectVal('select[name="cargo_reb2"]'); dados.motivo = getVal('input[name="motivo_reb"]'); dados.data = getData('input[name="data_reb"]'); break;
        case "form6": dados.nicknames = [getVal('input[name="nick_sai"]')]; dados.cargoAnterior = getSelectVal('select[name="cargo_sai"]'); dados.motivo = getVal('input[name="motivo_sai"]'); dados.permissao = getVal('input[name="perm_sai"]'); dados.termosAceitos = getTermos(); break;
        case "form8": dados.nicknames = [getVal('input[placeholder="Nickname"]')]; dados.subgrupos = getSubgrupos(false); break;
        case "form9": dados.nicknames = [getVal('input[placeholder="Nickname"]')]; dados.corpoDestino = getSelectVal('select'); dados.permissao = getVal('input[placeholder="Permissão"]') || getVal('input[placeholder="Permissao"]'); break;
        case "form10": dados.cargo = getSelectVal('select'); dados.nicknameAtual = getVal('input[placeholder="Nickname atual"]'); dados.novoNickname = getVal('input[placeholder="Novo nickname"]'); dados.nicknames = [dados.novoNickname]; break;
        case "form11": { dados.nicknames = [getVal('input[placeholder="Nickname"]')]; const selects = formEl.querySelectorAll('select'); dados.cargoAlcancado = selects[0] ? selects[0].value : ""; dados.capacitacaoNecessaria = selects[1] ? selects[1].value : ""; dados.permissao = getVal('input[placeholder="Permissão"]') || getVal('input[placeholder="Permissao"]'); break; }
        case "form12": dados.nicknames = [getVal('#attlist_tag')]; break;
        case "form13": { const sel = formEl.querySelector('select'); dados.tipoAdvertencia = sel ? sel.options[sel.selectedIndex].innerText : ""; dados.nicknames = [getVal('input[placeholder="Nickname"]')]; dados.motivo = getVal('input[placeholder="Motivo(s)"]'); dados.periodo = getPeriodo(30); break; }
        case "form14": dados.nicknames = [getVal('input[placeholder="Nickname"]')]; dados.tipoCapacitacao = getSelectVal('select'); break;
    }
    dados.nicknames = (dados.nicknames || []).filter(n => n && n.length > 0);
    return dados;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function gerarIdRequerimento() {
    if (!firebaseDb) return null;
    const contadorRef = firebaseDb.ref("contador_requerimentos");
    return new Promise((resolve, reject) => {
        contadorRef.transaction(function (current) { return (current || 0) + 1; }, function (error, committed, snapshot) {
            if (error) { reject(error); return; }
            if (!committed) { reject(new Error("Contador travado")); return; }
            resolve("REQ" + String(snapshot.val()).padStart(2, "0"));
        });
    });
}

async function registrarRequerimento(formId, dados, bbcodeMessage) {
    if (!firebaseDb) return null;
    try {
        const idReq = await gerarIdRequerimento();
        const autorNick = currentUser || usuarioLogado || "Desconhecido";
        const registro = {
            id: idReq, tipo: formId, titulo: formTitles[formId] || formId, status: "Pendente",
            dataEnvio: Date.now(), dataFormatada: retorna_horario(), autor: autorNick,
            autorAvatar: autorNick ? "https://www.habbo.com.br/habbo-imaging/avatarimage?user=" + encodeURIComponent(autorNick) + "&action=std&direction=2&head_direction=3&gesture=sml&size=m" : "",
            nicknames: dados.nicknames || [], campos: dados, bbcode: bbcodeMessage, postagens: {}
        };
        await firebaseDb.ref("requerimentos/" + idReq).set(registro);
        return idReq;
    } catch (e) { return null; }
}

async function postarNoForum(threadId, mensagem, tentativa) {
    tentativa = tentativa || 1;
    const maxTentativas = 3, delayFlood = 15000;
    try {
        const resposta = await $.post("/post", { t: threadId, message: mensagem, mode: "reply", post: 1 });
        if (typeof resposta === "string") {
            const flood = resposta.includes("Você não pode postar outra mensagem tão rapidamente") ||
                resposta.includes("O controle do flood esta ativo neste forum") || resposta.includes("flood");
            const sessao = resposta.includes('<form id="login"') || resposta.includes("Voce nao pode responder");
            if (flood && tentativa < maxTentativas) { await delay(delayFlood); return postarNoForum(threadId, mensagem, tentativa + 1); }
            if (flood) return { sucesso: false, threadId, erro: "Flood control (max retries)" };
            if (sessao) return { sucesso: false, threadId, erro: "Sessão expirada" };
        }
        return { sucesso: true, threadId };
    } catch (err) { return { sucesso: false, threadId, erro: "Erro de conexão" }; }
}

async function enviarParaTopicos(destinos, mensagem) {
    const resultados = [];
    for (let i = 0; i < destinos.length; i++) {
        if (i > 0) await delay(8000);
        resultados.push(await postarNoForum(destinos[i], mensagem));
    }
    return resultados;
}

/* ================= IFRAME DE VEREDITO (vai no BBCode do post) =================
   Aponta SOMENTE para esta página do fórum (?status=REQxx).
   Nenhum link/ID do firebase vai para o BBCode: quem lê o veredito é a própria página.
   O iframe se redimensiona sozinho (mesma origem) e tem fundo transparente. */
function urlStatusRequerimento(idReq) {
    const base = window.INS_STATUS_URL || (location.origin + location.pathname);
    return base + '?status=' + encodeURIComponent(idReq);
}

function gerarIframeStatus(idReq) {
    return '<iframe src="' + urlStatusRequerimento(idReq) + '" width="100%" height="84" frameborder="0" scrolling="no" allowtransparency="true" style="border:0;display:block;max-width:100%;background:transparent"></iframe>';
}

/* ================= IFRAME OCULTO (só URLs do fórum) ================= */
(function () {
    'use strict';
    var FRAME_ID = 'insHiddenFrame';
    function sameForum(url) { try { return new URL(url, location.href).origin === location.origin; } catch (e) { return false; } }
    function ensureFrame() {
        var f = document.getElementById(FRAME_ID);
        if (f) return f;
        f = document.createElement('iframe');
        f.id = FRAME_ID; f.name = FRAME_ID; f.title = 'ins-frame'; f.tabIndex = -1;
        f.setAttribute('aria-hidden', 'true');
        f.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
        (document.body || document.documentElement).appendChild(f);
        return f;
    }
    function isBlank(f) { try { return f.contentWindow.location.href === 'about:blank'; } catch (e) { return false; } }
    function waitLoad(f, trigger, ms) {
        return new Promise(function (resolve, reject) {
            var t = setTimeout(function () { f.onload = null; reject(new Error('INS_FRAME: tempo esgotado')); }, ms || 30000);
            f.onload = function () {
                if (isBlank(f)) return;
                clearTimeout(t); f.onload = null;
                var doc = null; try { doc = f.contentDocument; } catch (e) { }
                resolve(doc);
            };
            trigger();
        });
    }
    window.INS_FRAME = {
        el: ensureFrame,
        load: function (url) {
            if (!sameForum(url)) return Promise.reject(new Error('INS_FRAME: só URLs do fórum'));
            var f = ensureFrame();
            return waitLoad(f, function () { f.src = url; });
        },
        post: function (action, fields, method) {
            if (!sameForum(action)) return Promise.reject(new Error('INS_FRAME: só URLs do fórum'));
            var f = ensureFrame();
            var form = document.createElement('form');
            form.method = method || 'POST'; form.action = action; form.target = FRAME_ID;
            form.acceptCharset = 'UTF-8'; form.style.display = 'none';
            Object.keys(fields || {}).forEach(function (k) {
                var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = fields[k]; form.appendChild(i);
            });
            document.body.appendChild(form);
            return waitLoad(f, function () { form.submit(); }).then(
                function (d) { form.remove(); return d; },
                function (e) { form.remove(); throw e; });
        },
        badge: function (reqId) { return gerarIframeStatus(reqId); },
        topic: function (url) {
            return this.load(url).then(function (doc) {
                if (!doc) return null;
                var p = doc.querySelector('.postbody .content, .post .content, .post-content, .content');
                return p ? p.innerText : null;
            });
        }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureFrame);
    else ensureFrame();
})();

/* ---------------- BBCode do post ---------------- */
function gatherFormData() {
    if (!activeForm) return "";
    const formId = activeForm.id;
    const buildCard = (title, content) => {
        const header = '[table          bgcolor="00529e" style="border-radius: 14px 14px 0px 0px; overflow: hidden; width: 35%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][color=#f8f8ff][size=18][b][font=Poppins][url=https://servimg.com/view/20530675/8][img]https://i.servimg.com/u/f76/20/53/06/75/3gw3ye10.png[/img][/url]\n' + title + '[/font][/b][/size][/color][/td][/tr][/table]';
        const bodyStart = '[table          bgcolor="#f8f8ff" style="border-radius: 0px 16px 16px 16px; overflow: hidden; width: 60%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td][left][font=Poppins][size=13]';
        return header + bodyStart + content + '[/size][/font][/left][/td][/tr][/table]';
    };

    if (formId === "form12") {
        var attlist_tag_value = $("#attlist_tag").val();
        return '[font=Poppins][center][table style="border: none!important; overflow: hidden; border-radius: 20px; line-height: 1.2em; width: 74%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2)" bgcolor="00529e"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"][img(16px,16px)]https://2img.net/i.imgur.com/7Rfeuel.png[/img]\n\n[img]https://2img.net/i.imgur.com/ByuqeKm.png[/img]\n[color=white][size=18][b][INS] Atualizacao realizada! [' + attlist_tag_value + '] [/size][/b]\n\n[size=11]Foi realizada uma atualizacao neste horario, em caso de erros, consulte um membro do ministerio da Companhia dos Instrutores.[/color][/size]\n[/td][/tr][/table][/center][/font]';
    }

    if (formId === "form1") {
        const nickInput = activeForm.querySelector('input[name="nick_ent"]');
        const nicks = nickInput ? nickInput.value.trim() : "";
        let inner = "";
        if (nicks) nicks.split("/").map(s => s.trim()).filter(Boolean).forEach(line => { inner += '[font=Poppins][b][color=#000000]' + line + '[/color][/b][/font]\n'; });
        inner += "\n[b]Obs:[/b] Necessário adicionar em ambos";
        return buildCard(formTitles[formId], inner);
    }

    if (formId === "form13") {
        const inputs = activeForm.querySelectorAll("input, select");
        let tipo = "", cargoNickname = "", motivos = "";
        inputs.forEach(input => {
            if (input.tagName.toLowerCase() === "select") tipo = input.options[input.selectedIndex].innerText;
            else if (input.placeholder === "Nickname") cargoNickname = input.value.trim();
            else if (input.placeholder === "Motivo(s)") motivos = input.value.trim();
        });
        const today = new Date();
        const monthToday = today.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const formattedToday = String(today.getDate()).padStart(2, '0') + " " + monthToday.charAt(0).toUpperCase() + monthToday.slice(1) + " " + today.getFullYear();
        const futureDate = new Date(today); futureDate.setDate(today.getDate() + 30);
        const monthFuture = futureDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const formattedFutureDate = String(futureDate.getDate()).padStart(2, '0') + " " + monthFuture.charAt(0).toUpperCase() + monthFuture.slice(1) + " " + futureDate.getFullYear();
        let inner = "[b]Nickname:[/b] " + cargoNickname + "\n[b]Motivo(s):[/b] " + motivos + "\n[b]Periodo:[/b] " + formattedToday + " a " + formattedFutureDate + "\n";
        return buildCard(tipo || formTitles[formId], inner);
    }

    if (formId === "form3" || formId === "form7" || formId === "form8") {
        const nicknameInput = activeForm.querySelector('input[placeholder="Nickname"]');
        const nickname = nicknameInput ? nicknameInput.value.trim() : "";
        let inner = "";
        if (nickname) inner += "[b]Nickname:[/b] " + nickname + "\n";
        const diasInput = activeForm.querySelector('input[type="number"]');
        if (diasInput && diasInput.value.trim() !== "") {
            const dias = parseInt(diasInput.value.trim(), 10);
            if (!isNaN(dias)) {
                const hoje = new Date(); const final = new Date(); final.setDate(hoje.getDate() + dias);
                const formatarData = data => {
                    const dia = String(data.getDate()).padStart(2, '0');
                    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    return dia + " " + mes.charAt(0).toUpperCase() + mes.slice(1) + " " + data.getFullYear();
                };
                inner += "[b]Periodo:[/b] " + formatarData(hoje) + " a " + formatarData(final) + "\n";
            }
        }
        if (formId === "form3" || formId === "form7") {
            const permissaoCompanhia = activeForm.querySelector('input[name="permissaoCompanhia"]');
            if (permissaoCompanhia && permissaoCompanhia.value.trim() !== "") inner += "[b]Permissao (Companhia):[/b] " + permissaoCompanhia.value.trim() + "\n";
        }
        const selectedSubgrupos = activeForm.querySelectorAll('.subgrupo.selected');
        if (selectedSubgrupos.length > 0) {
            inner += "[b]Subgrupos:[/b]\n";
            selectedSubgrupos.forEach(sg => {
                const label = sg.getAttribute('data-label');
                if (formId === "form3" || formId === "form7") {
                    const inputPerm = activeForm.querySelector('input[data-thread="' + sg.getAttribute('data-thread') + '"]');
                    const permValue = inputPerm ? inputPerm.value.trim() : "";
                    inner += "- " + label + (permValue ? " (Permissao: " + permValue + ")" : "") + "\n";
                } else inner += "- " + label + "\n";
            });
        }
        if (formId === "form3") {
            const checkbox = activeForm.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) inner += '[color=#00529e][b]☒[/b][/color] ' + checkbox.nextElementSibling.innerText.trim() + "\n";
        }
        return buildCard(formTitles[formId], inner);
    }

    let inner = "";
    const title = formTitles[formId];
    const inputs = activeForm.querySelectorAll("input, select, textarea");
    let placeholdersData = "";
    inputs.forEach(input => {
        if (input.type !== "checkbox") {
            let placeholder = input.placeholder || (input.options && input.options.length > 0 ? input.options[0].innerText : "");
            const value = input.value.trim();
            if (value) {
                let formattedValue = value;
                if (input.type === "date" && (formId === "form1" || formId === "form2" || formId === "form4" || formId === "form5" || formId === "form6" || formId === "form11")) {
                    const dateParts = value.split("-"); formattedValue = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];
                }
                if (input.tagName.toLowerCase() === "select") {
                    placeholder = input.options[0].innerText;
                    formattedValue = input.options[input.selectedIndex].innerText;
                }
                if (placeholder === "TAG") {
                    formattedValue.split(" / ").forEach(line => placeholdersData += '[font=Poppins][b][color=#000000]' + line + '[/color][/b][/font]\n');
                } else placeholdersData += "[b]" + placeholder + "[/b]: " + formattedValue + "\n";
            }
        }
    });
    inner += placeholdersData;
    if (formId === "form1" || formId === "form2" || formId === "form6" || formId === "form11") {
        const today = new Date();
        inner += "[b]Data:[/b] " + String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear() + "\n";
    }
    activeForm.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) inner += '[color=#00529e][b]☒[/b][/color] ' + checkbox.nextElementSibling.innerText.trim() + "\n";
    });
    return buildCard(title, inner);
}

function enviarmp() {
    /* >>> COLE AQUI, DENTRO DAS CHAVES, os 4 templates do seu script atual:
       "Avaliador": `...`, "Capacitador": `...`, "Estagiário": `...`, "Ministro": `...` <<< */
    const mpTemplates = {
    };

    const cargoSelecionado = document.querySelector('[name="cargo_pro2"]').value;
    const nomes = document.querySelector('[name="nick_pro"]').value.trim().split("/");
    if (!Object.keys(mpTemplates).includes(cargoSelecionado)) return;
    nomes.forEach(function (nickBruto) {
        const nick = nickBruto.trim();
        const mensagemFinal = mpTemplates[cargoSelecionado]?.replaceAll('{USERNAME}', nick);
        if (mensagemFinal) {
            $.post("/privmsg", { folder: "inbox", mode: "post", username: nick, subject: `[INS] Promocao a ${cargoSelecionado}`, message: mensagemFinal, post: 1 });
        }
    });
}

/* === Handler de submit: Firebase primeiro, depois fórum === */
(function ($) {
    $(window).on("load", function () {
        $(document).off("submit", "form").on("submit", "form", async function (event) {
            event.preventDefault();
            let isValid = true;
            $(this).find("input[required], textarea[required], select[required]").each(function () {
                if ($(this).val().trim() === "") {
                    isValid = false;
                    $(this).addClass("campo-erro");
                    setTimeout(() => $(this).removeClass("campo-erro"), 3000);
                }
            });
            if (!isValid) { showToast("Atenção", "Há campos obrigatórios vazios. Preencha todos antes de enviar.", "err"); return; }

            const bbcodeBase = gatherFormData();
            if (!bbcodeBase) { showToast("Atenção", "Preencha todos os campos!", "err"); return; }

            const botao = $(this).find("button[type='submit']");
            botao.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Registrando...');

            const formId = $(this).closest(".req-form").attr("id");
            const dadosEstruturados = extrairDadosEstruturados(formId, this);

            const idReq = await registrarRequerimento(formId, dadosEstruturados, bbcodeBase);
            if (!idReq) {
                showToast("Erro", "Falha ao registrar no Firebase. Tente novamente.", "err");
                botao.prop("disabled", false).html('<i class="fas fa-paper-plane"></i> Enviar requerimento');
                return;
            }

            const bbcodeMessage = bbcodeBase + "\n\n" + gerarIframeStatus(idReq);
            enviarmp();

            let destinos = ["1"];
            if (formId === "form3" || formId === "form7" || formId === "form8") {
                document.querySelectorAll('#' + formId + ' .subgrupo.selected').forEach(sg => {
                    const threadId = sg.getAttribute("data-thread");
                    if (threadId) destinos.push(threadId);
                });
            }
            destinos = [...new Set(destinos)];

            botao.html('<i class="fas fa-spinner fa-spin"></i> Postando em ' + destinos.length + ' tópico(s)...');
            const resultados = await enviarParaTopicos(destinos, bbcodeMessage);

            if (firebaseDb && idReq) {
                const updates = {};
                resultados.forEach((res, idx) => { updates[idx] = { threadId: res.threadId, sucesso: res.sucesso, erro: res.erro || null, data: Date.now() }; });
                await firebaseDb.ref("requerimentos/" + idReq + "/postagens").set(updates).catch(() => { });
            }

            botao.prop("disabled", false).html('<i class="fas fa-paper-plane"></i> Enviar requerimento');

            const erros = resultados.filter(r => !r.sucesso);
            if (erros.length > 0) {
                showToast("Atenção", "Alguns envios falharam: " + erros.map(e => e.threadId + ": " + e.erro).join(" | "), "err");
            } else {
                showToast("Sucesso", "Requerimento " + idReq + " registrado e postado em todos os tópicos.", "ok");
                setTimeout(() => { location.href = "http://" + location.host + "/t1-?view=newest"; }, 1500);
            }
        });
    });
})(jQuery);

/* =====================================================================
   PAINEL DE GESTÃO
   ===================================================================== */
/* Listagem (nicks e cargos): projeto antigo, SOMENTE LEITURA */
var LISTAGEM_CONFIG = { databaseURL: 'https://dashboardteste-73cc6-default-rtdb.firebaseio.com' };
var PN_ST = { PEN: 'Pendente', APR: 'Aprovado', REC: 'Recusado', CAN: 'Cancelado' };
var PN_CARGOS = { lider: 'Líder', viceLideres: 'Vice-Líder', ministros: 'Ministro', estagiarios: 'Estagiário' };
var PN_LABELS = {
    nicknames: 'Nickname(s)', role: 'Cargo', cargoResultante: 'Cargo resultante', cargoAnterior: 'Cargo anterior/atual', cargoNovo: 'Novo cargo',
    cargo: 'Cargo', motivo: 'Motivo(s)', permissao: 'Permissão', permissaoCompanhia: 'Permissão (Companhia)', dias: 'Quantidade de dias',
    periodo: 'Período', subgrupos: 'Subgrupos', data: 'Data', dataRegistro: 'Data do registro', corpoDestino: 'Migrando para o',
    nicknameAtual: 'Nickname atual', novoNickname: 'Novo nickname', cargoAlcancado: 'Cargo alcançado', capacitacaoNecessaria: 'Capacitação',
    tipoAdvertencia: 'Tipo', tipoCapacitacao: 'Tipo de capacitação', termosAceitos: 'Termos aceitos', observacao: 'Observação'
};
var PN_GRUPOS = [
    { t: 'Envolvidos', i: 'fa-users', k: ['nicknames', 'nicknameAtual', 'novoNickname'] },
    { t: 'Cargo e tipo', i: 'fa-layer-group', k: ['cargoAnterior', 'cargoNovo', 'cargoResultante', 'cargo', 'cargoAlcancado', 'corpoDestino', 'tipoAdvertencia', 'tipoCapacitacao', 'capacitacaoNecessaria'] },
    { t: 'Detalhes', i: 'fa-circle-info', k: ['motivo', 'observacao', 'permissao', 'permissaoCompanhia', 'subgrupos', 'termosAceitos'] },
    { t: 'Datas', i: 'fa-calendar-days', k: ['data', 'dias', 'periodo', 'dataRegistro'] }
];
var PN_NICKS = { nicknames: 1, nicknameAtual: 1, novoNickname: 1 };
var PN_LARGOS = { motivo: 1, observacao: 1, subgrupos: 1, termosAceitos: 1 };
var PN_ICONES_ST = { Pendente: 'fa-hourglass-half', Aprovado: 'fa-circle-check', Recusado: 'fa-circle-xmark', Cancelado: 'fa-ban', Todos: 'fa-layer-group' };

var dbList = null, pnMe = null, pnData = {}, pnRef = null, pnMontado = false, pnBusy = {}, pnAbertos = {};
var pnFiltro = 'Pendente', pnBusca = '', pnTipo = '';

formTitles.painel = 'Painel de gestão';
formIcons.painel = 'fa-solid fa-table-list';

(function () {
    var st = document.createElement('style');
    st.textContent = `
/* ---- resumo (cartões de status) ---- */
.gp-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.gp-chip{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid var(--bdr);border-radius:16px;background:var(--sfc);color:var(--txt);cursor:pointer;text-align:left;font-family:inherit;box-shadow:var(--sh-xs);transition:border-color .15s,background .15s,transform .1s,box-shadow .15s}
.gp-chip .ci{width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--c,var(--p));background:color-mix(in srgb,var(--c,var(--p)) 14%,transparent)}
.gp-chip .cc{display:flex;flex-direction:column;min-width:0}
.gp-chip b{font:700 21px/1.1 'Space Grotesk',sans-serif;color:var(--txt)}
.gp-chip .cc span{font-size:11.5px;font-weight:600;color:var(--txt3)}
.gp-chip:hover{border-color:var(--txt4);box-shadow:var(--sh)}
.gp-chip:active{transform:scale(.98)}
.gp-chip.on{border-color:var(--c,var(--p));background:color-mix(in srgb,var(--c,var(--p)) 9%,var(--sfc));box-shadow:0 0 0 3px color-mix(in srgb,var(--c,var(--p)) 16%,transparent)}
.gp-chip.gs-Pendente{--c:var(--gld)}.gp-chip.gs-Aprovado{--c:var(--ok)}.gp-chip.gs-Recusado{--c:var(--err)}.gp-chip.gs-Cancelado{--c:var(--txt3)}
.gp-tools{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;padding:10px;border:1px solid var(--bdr-lt);border-radius:16px;background:var(--in)}
.gp-search{position:relative;flex:1;min-width:200px}
.gp-search i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:13px;pointer-events:none}
.gp-search input,.gp-tools select{height:42px;border-radius:11px;border:1.5px solid var(--bdr);background:var(--sfc);color:var(--txt);font:13px 'Inter',sans-serif;outline:none;padding:0 14px}
.gp-search input{width:100%;padding-left:38px}
.gp-search input:focus,.gp-tools select:focus{border-color:var(--p);box-shadow:0 0 0 3px var(--glow)}
.gp-empty{text-align:center;padding:60px 20px;color:var(--txt3);font-size:14px}
.gp-empty i{display:block;font-size:38px;margin-bottom:12px;opacity:.35}

/* ---- cartão do requerimento ---- */
.gc{--c:var(--gld);position:relative;margin-bottom:20px;background:var(--sfc);border:1px solid var(--bdr);border-radius:20px;box-shadow:var(--sh-sm);overflow:hidden;transition:box-shadow .2s,border-color .2s}
.gc:hover{box-shadow:var(--sh-md);border-color:color-mix(in srgb,var(--c) 38%,var(--bdr))}
.gs-Pendente{--c:var(--gld)}.gs-Aprovado{--c:var(--ok)}.gs-Recusado{--c:var(--err)}.gs-Cancelado{--c:var(--txt3)}
.gc-head{display:flex;align-items:center;gap:14px;padding:16px 22px;border-bottom:1px solid var(--bdr-lt);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 7%,var(--sfc)),var(--sfc))}
.gc-ic{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 35%,transparent)}
.gc-hm{flex:1;min-width:0}
.gc-title{margin:0;font:700 16px/1.25 'Space Grotesk',sans-serif;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gc-sub{margin-top:3px;display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;font-size:12px;color:var(--txt3)}
.gc-id{padding:1px 8px;border-radius:6px;border:1px solid var(--bdr);background:var(--in);color:var(--txt2);font-weight:800;font-size:11px;font-variant-numeric:tabular-nums}
.gc-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent);border:1px solid color-mix(in srgb,var(--c) 55%,transparent);white-space:nowrap}
.gc-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--c)}

.gc-body{display:grid;grid-template-columns:210px minmax(0,1fr)}
.gc-side{display:flex;flex-direction:column;align-items:center;gap:4px;padding:24px 16px 20px;background:var(--in);border-right:1px solid var(--bdr-lt)}
.gc-ava{position:relative;width:92px;height:92px;margin-bottom:8px;border-radius:50%;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--c) 22%,var(--sfc)),var(--sfc));border:3px solid var(--c);box-shadow:0 0 0 5px color-mix(in srgb,var(--c) 13%,transparent),var(--sh);overflow:hidden;display:flex;align-items:center;justify-content:center}
.gc-ava img{position:absolute;left:50%;top:6px;width:auto;height:auto;max-width:none;transform:translateX(-50%) scale(1.25);transform-origin:top center;image-rendering:pixelated}
.gc-who{max-width:100%;text-align:center;font:700 15px/1.3 'Space Grotesk',sans-serif;color:var(--txt);word-break:break-all}
.gc-role{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--txt3)}
.gc-acts{width:100%;margin-top:16px;padding-top:16px;border-top:1px dashed var(--bdr);display:flex;flex-direction:column;gap:9px}
.gc-btn{display:flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:12px;font:700 13px 'Inter',sans-serif;cursor:pointer;color:var(--b);background:color-mix(in srgb,var(--b) 12%,transparent);border:1px solid color-mix(in srgb,var(--b) 55%,transparent);transition:background .15s,transform .1s}
.gc-btn:hover:not(:disabled){background:color-mix(in srgb,var(--b) 24%,transparent)}
.gc-btn:active:not(:disabled){transform:scale(.98)}
.gc-btn:focus-visible{outline:2px solid var(--p);outline-offset:2px}
.gc-btn:disabled{opacity:.5;cursor:wait}
.gc-btn.ok{--b:var(--ok)}.gc-btn.no{--b:var(--err)}.gc-btn.cn{--b:var(--gld)}
.gc-final{margin-top:16px;padding-top:16px;border-top:1px dashed var(--bdr);font-size:12px;line-height:1.5;color:var(--txt3);text-align:center;font-style:italic}

.gc-main{display:flex;flex-direction:column;gap:22px;min-width:0;padding:22px 26px 24px}
.gc-sec h4{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:10.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--txt2)}
.gc-sec h4 i{font-size:11px;color:var(--p)}
.gc-sec h4::after{content:"";flex:1;height:1px;background:var(--bdr-lt)}
.gc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
.gc-f{min-width:0;padding:10px 13px;border-radius:12px;background:var(--in);border:1px solid var(--bdr-lt)}
.gc-f.wide{grid-column:1/-1}
.gc-f .k{display:block;margin-bottom:3px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--txt3)}
.gc-f .v{display:block;font-size:13.5px;line-height:1.5;color:var(--txt);word-break:break-word}
.gc-f .v.mute,.v.mute{color:var(--txt3);font-style:italic}
.gc-nk{display:inline-flex;align-items:center;gap:8px;margin:0 6px 4px 0;padding:3px 12px 3px 4px;border-radius:99px;background:var(--sfc);border:1px solid var(--bdr);font-size:13px;font-weight:600}
.gc-nk img{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:center 15%;background:var(--in)}
.gc-trans{display:inline-flex;align-items:center;flex-wrap:wrap;gap:10px}
.gc-trans b{padding:3px 11px;border-radius:8px;background:var(--sfc);border:1px solid var(--bdr);font-size:13px}
.gc-trans i{color:var(--c);font-size:12px}
.gc-dec{padding:16px;border-radius:16px;background:color-mix(in srgb,var(--c) 6%,var(--sfc));border:1px solid color-mix(in srgb,var(--c) 28%,var(--bdr))}
.gc-dec .gc-f{background:var(--sfc)}
.gc-who2{display:inline-flex;align-items:center;gap:8px}
.gc-who2 img{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:center 15%;background:var(--in);border:1px solid var(--bdr)}
.gc-who2 small{color:var(--txt3);font-weight:600}
.gc-more{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.gc-post{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:600;background:var(--in);border:1px solid var(--bdr-lt);color:var(--txt2)}
.gc-post.ok i{color:var(--ok)}.gc-post.fail i{color:var(--err)}
.gc details{font-size:12.5px;color:var(--txt2)}
.gc details summary{cursor:pointer;font-weight:700;color:var(--p)}
.gc-hist{list-style:none;margin:10px 0 0;padding:0 0 0 14px;border-left:2px solid var(--bdr)}
.gc-hist li{position:relative;padding:0 0 12px 14px;font-size:12.5px;line-height:1.5}
.gc-hist li::before{content:"";position:absolute;left:-21px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--c);border:2px solid var(--sfc)}
.gc-hist .hc{display:inline-block;margin-right:6px;padding:1px 9px;border-radius:99px;font-size:10.5px;font-weight:800;color:#fff;background:var(--c)}
.gc-hist time{display:block;color:var(--txt3);font-size:11.5px}
.gc-hist .mot{margin-top:4px;padding:7px 10px;border-radius:8px;background:var(--in);border:1px solid var(--bdr-lt);color:var(--txt2)}
@media(max-width:720px){.gc-body{grid-template-columns:1fr}.gc-side{border-right:0;border-bottom:1px solid var(--bdr-lt)}.gc-acts{max-width:360px}.gc-main{padding:18px}.gc-head{padding:14px 16px;flex-wrap:wrap}}

/* ---- popup de motivo ---- */
.gm{position:fixed;inset:0;z-index:4000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(6,10,20,.62);backdrop-filter:blur(4px)}
.gm.open{display:flex;animation:fadeIn .2s ease}
.gm-box{width:100%;max-width:460px;background:var(--sfc);border:1px solid var(--bdr);border-radius:18px;box-shadow:var(--sh-xl);overflow:hidden}
.gm-hd{display:flex;align-items:center;gap:14px;padding:18px 22px;border-bottom:1px solid var(--bdr-lt)}
.gm-ic{width:40px;height:40px;flex:0 0 40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--b,var(--err));background:color-mix(in srgb,var(--b,var(--err)) 14%,transparent)}
.gm-tt{font:700 16px 'Space Grotesk',sans-serif;color:var(--txt)}
.gm-sub{margin-top:2px;font-size:12px;color:var(--txt3)}
.gm-bd{padding:18px 22px 6px}
.gm-bd label{display:block;margin-bottom:7px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--txt2)}
.gm-bd textarea{width:100%;min-height:104px;resize:vertical;padding:12px 14px;border-radius:12px;border:1.5px solid var(--bdr);background:var(--in);color:var(--txt);font:14px/1.5 'Inter',sans-serif;outline:none}
.gm-bd textarea:focus{border-color:var(--p);box-shadow:0 0 0 3px var(--glow)}
.gm-cnt{margin-top:4px;text-align:right;font-size:11px;color:var(--txt3)}
.gm-warn{margin:0 22px 8px;padding:9px 12px;border-radius:10px;font-size:12px;line-height:1.5;color:var(--txt2);background:color-mix(in srgb,var(--gld) 12%,transparent);border:1px solid color-mix(in srgb,var(--gld) 45%,transparent)}
.gm-ft{display:flex;gap:10px;justify-content:flex-end;padding:14px 22px 20px}
.gm-ft button{height:42px;padding:0 20px;border:none;border-radius:11px;font:700 13px 'Inter',sans-serif;cursor:pointer}
.gm-ft .gm-no{background:var(--in);color:var(--txt2);border:1px solid var(--bdr)}
.gm-ft .gm-yes{color:#fff;background:var(--b,var(--err))}
.gm-ft .gm-yes:hover{filter:brightness(1.08)}
`;
    document.head.appendChild(st);
})();

function pnEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pnNorm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function pnCls(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-'); }
function pnEstado(s) { return (s === PN_ST.APR || s === PN_ST.REC || s === PN_ST.CAN) ? s : PN_ST.PEN; } /* "Em análise" antigo = Pendente */
function pnLabel(k) { return PN_LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); }
function pnDataHora(t) { return t ? new Date(t).toLocaleString('pt-BR') : '—'; }
function pnDataLonga(t) {
    if (!t) return '—';
    return new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '');
}

/* busto completo (coluna do solicitante) e só a cabeça (chips) */
function pnAvatar(nick, full) {
    var u = encodeURIComponent(nick || '');
    return full
        ? 'https://www.habbo.com.br/habbo-imaging/avatarimage?user=' + u + '&action=std&direction=2&head_direction=3&gesture=sml&headonly=0&size=l&img_format=png'
        : 'https://www.habbo.com.br/habbo-imaging/avatarimage?user=' + u + '&direction=2&head_direction=3&gesture=sml&headonly=1&size=m&img_format=png';
}

function pnFmt(v) {
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(pnFmt).filter(Boolean).join(', ');
    if (typeof v === 'object') {
        if (v.inicio && v.fim) return v.inicio + ' a ' + v.fim;
        if (v.label) return v.label + (v.permissao ? ' (Permissão: ' + v.permissao + ')' : '');
        return Object.keys(v).map(function (k) { return pnLabel(k) + ': ' + pnFmt(v[k]); }).join(' · ');
    }
    return String(v);
}

function pnCargo(d, nick) {
    var alvo = pnNorm(nick);
    for (var k in PN_CARGOS) {
        var lista = d[k] || [];
        for (var i = 0; i < lista.length; i++) {
            if (lista[i] && !lista[i].vacant && pnNorm(lista[i].name) === alvo) return PN_CARGOS[k];
        }
    }
    return null;
}

async function iniciarPainel() {
    if (INS_STATUS_ID) return;
    if (!window.firebase || !firebaseDb) return;
    try { dbList = firebase.initializeApp(LISTAGEM_CONFIG, 'listagem').database(); } catch (e) { return; }
    var nick = await pegarUsername();
    if (!nick) return;
    dbList.ref('listagem/atual/data').on('value', function (snap) {
        var cargo = pnCargo(snap.val() || {}, nick);
        var panelButton = document.getElementById('navPainel');
        if (!cargo) {
            pnMe = null; pnMontado = false; pnData = {};
            if (pnRef) { pnRef.off(); pnRef = null; }
            if (panelButton) { panelButton.style.display = 'none'; panelButton.classList.remove('active'); }
            document.getElementById('painelRoot').innerHTML = '';
            if (activeForm && activeForm.id === 'painel') {
                activeForm.classList.remove('active'); activeForm = null;
                document.getElementById('emptyState').style.display = '';
                document.getElementById('tituloFormAtivo').textContent = 'Selecione um requerimento';
                document.querySelectorAll('.req-nav-list li').forEach(function (l) { l.classList.remove('active'); });
            }
            return;
        }
        pnMe = { nick: nick, cargo: cargo };
        if (panelButton) panelButton.style.display = 'inline-flex';
        if (!pnMontado) pnMontar();
        else pnDesenhar();
    });
}

function pnMontar() {
    pnMontado = true;
    document.getElementById('painelRoot').innerHTML =
        '<div class="gp-sum" id="gpSum"></div>' +
        '<div class="gp-tools">' +
        '<label class="gp-search"><i class="fa-solid fa-magnifying-glass"></i><input id="gpBusca" type="text" autocomplete="off" placeholder="Buscar por ID, solicitante ou nickname..." /></label>' +
        '<select id="gpTipo"><option value="">Todos os tipos</option></select></div>' +
        '<div id="pnLista"><div class="gp-empty">Carregando...</div></div>';

    var lista = document.getElementById('pnLista');
    document.getElementById('gpSum').addEventListener('click', function (e) {
        var c = e.target.closest('.gp-chip');
        if (!c) return;
        pnFiltro = c.dataset.f; pnDesenhar();
    });
    document.getElementById('gpBusca').addEventListener('input', function (e) { pnBusca = pnNorm(e.target.value); pnDesenhar(); });
    document.getElementById('gpTipo').addEventListener('change', function (e) { pnTipo = e.target.value; pnDesenhar(); });
    lista.addEventListener('toggle', function (e) {
        var d = e.target;
        if (d.tagName === 'DETAILS' && d.dataset.k) pnAbertos[d.dataset.k] = d.open;
    }, true);
    lista.addEventListener('click', pnClique);

    pnRef = firebaseDb.ref('requerimentos').orderByChild('dataEnvio').limitToLast(150);
    pnRef.on('value', function (snap) { pnData = snap.val() || {}; pnDesenhar(); },
        function (err) { lista.innerHTML = '<div class="gp-empty"><i class="fa-solid fa-triangle-exclamation"></i>Erro: ' + pnEsc(err.message) + '</div>'; });
}

function gcRow(label, htmlValue, wide) {
    return '<div class="gc-f' + (wide ? ' wide' : '') + '"><span class="k">' + pnEsc(label) + '</span><span class="v">' + htmlValue + '</span></div>';
}
function gcNicks(v) {
    return [].concat(v).filter(Boolean).map(function (n) {
        return '<span class="gc-nk"><img src="' + pnAvatar(n, false) + '" alt="" loading="lazy">' + pnEsc(n) + '</span>';
    }).join('');
}

/* organiza os campos do requerimento por grupos */
function gcGrupos(c) {
    var usados = {}, html = '';
    function vazio(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
    PN_GRUPOS.forEach(function (g) {
        var rows = '';
        g.k.forEach(function (k) {
            var v = c[k];
            if (usados[k] || vazio(v)) return;
            usados[k] = 1;
            if (k === 'cargoAnterior' && !vazio(c.cargoNovo)) {
                usados.cargoNovo = 1;
                rows += gcRow('Cargo', '<span class="gc-trans"><b>' + pnEsc(c.cargoAnterior) + '</b><i class="fa-solid fa-arrow-right"></i><b>' + pnEsc(c.cargoNovo) + '</b></span>', true);
            } else if (PN_NICKS[k]) {
                rows += gcRow(pnLabel(k), gcNicks(v), true);
            } else {
                rows += gcRow(pnLabel(k), pnEsc(pnFmt(v)), !!PN_LARGOS[k]);
            }
        });
        if (rows) html += '<div class="gc-sec"><h4><i class="fa-solid ' + g.i + '"></i>' + g.t + '</h4><div class="gc-grid">' + rows + '</div></div>';
    });
    var outros = '';
    Object.keys(c).forEach(function (k) {
        if (usados[k] || vazio(c[k])) return;
        outros += gcRow(pnLabel(k), pnEsc(pnFmt(c[k])), false);
    });
    if (outros) html += '<div class="gc-sec"><h4><i class="fa-solid fa-ellipsis"></i>Outros</h4><div class="gc-grid">' + outros + '</div></div>';
    return html || '<div class="gc-sec"><div class="gc-grid">' + gcRow('Dados', '<span class="v mute">Sem dados estruturados</span>', true) + '</div></div>';
}

function gcDecisao(r, est) {
    var decidido = est !== PN_ST.PEN;
    var pill = '<span class="gc-pill">' + pnEsc(est) + '</span>';
    var quem = r.avaliador
        ? '<span class="gc-who2"><img src="' + pnAvatar(r.avaliador, false) + '" alt="" loading="lazy"><span>' + pnEsc(r.avaliador) + (r.cargoAvaliador ? ' <small>· ' + pnEsc(r.cargoAvaliador) + '</small>' : '') + '</span></span>'
        : '<span class="v mute">Aguardando decisão</span>';
    var quando = r.dataAtualizacao && decidido ? pnEsc(pnDataLonga(r.dataAtualizacao)) : '<span class="v mute">—</span>';
    var motivo = r.motivoCancelamento || r.motivo || (decidido ? r.obs : '');
    var motivoHtml = motivo ? pnEsc(motivo) : '<span class="v mute">' + (decidido ? 'Sem motivo informado' : '—') + '</span>';
    var rotuloMotivo = r.motivoCancelamento ? 'Motivo do cancelamento' : 'Motivo';
    return '<div class="gc-sec"><h4><i class="fa-solid fa-gavel"></i>Decisão</h4><div class="gc-dec"><div class="gc-grid">' +
        gcRow('Status', pill) + gcRow('Usuário responsável', quem) + gcRow('Data da decisão', quando) +
        gcRow(rotuloMotivo, motivoHtml, true) + '</div></div></div>';
}

function gcHistorico(id, r) {
    var h = r.historico ? Object.keys(r.historico).map(function (k) { return r.historico[k]; }) : [];
    if (!h.length) return '';
    h.sort(function (a, b) { return (a.em || 0) - (b.em || 0); });
    var lis = h.map(function (x) {
        return '<li class="gs-' + pnCls(x.acao || '') + '"><span class="hc">' + pnEsc(x.acao || '') + '</span>por <b>' + pnEsc(x.por || '—') + '</b>' +
            (x.cargo ? ' <small>(' + pnEsc(x.cargo) + ')</small>' : '') + '<time>' + pnEsc(pnDataLonga(x.em)) + '</time>' +
            (x.motivo ? '<div class="mot">' + pnEsc(x.motivo) + '</div>' : '') + '</li>';
    }).join('');
    var k = id + ':h';
    return '<details data-k="' + pnEsc(k) + '"' + (pnAbertos[k] ? ' open' : '') + '><summary>Histórico de decisões (' + h.length + ')</summary><ol class="gc-hist">' + lis + '</ol></details>';
}

function gcPostagens(r) {
    var posts = r.postagens ? Object.keys(r.postagens).map(function (k) { return r.postagens[k]; }) : [];
    if (!posts.length) return '';
    return '<div class="gc-more">' + posts.map(function (p) {
        return '<span class="gc-post ' + (p.sucesso ? 'ok' : 'fail') + '" title="' + pnEsc(p.erro || '') + '"><i class="fa-solid ' + (p.sucesso ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i>Tópico ' + pnEsc(p.threadId) + '</span>';
    }).join('') + '</div>';
}

function pnCard(id, r) {
    var est = pnEstado(r.status), dis = pnBusy[id] ? ' disabled' : '';
    var acts;
    if (est === PN_ST.PEN) {
        acts = '<div class="gc-acts"><button class="gc-btn ok" data-a="apr"' + dis + '><i class="fa-solid fa-check"></i> Aprovar</button>' +
            '<button class="gc-btn no" data-a="rec"' + dis + '><i class="fa-solid fa-xmark"></i> Reprovar</button></div>';
    } else if (est === PN_ST.CAN) {
        acts = '<div class="gc-final">Requerimento cancelado.<br>Finalizado, sem novas alterações.</div>';
    } else {
        acts = '<div class="gc-acts"><button class="gc-btn cn" data-a="can"' + dis + '><i class="fa-solid fa-rotate-left"></i> Cancelar ' + (est === PN_ST.APR ? 'aprovação' : 'reprovação') + '</button></div>';
    }
    var autor = r.autor || '—';
    return '<article class="gc gs-' + pnCls(est) + '" data-id="' + pnEsc(id) + '">' +
        '<header class="gc-head"><span class="gc-ic"><i class="' + (formIcons[r.tipo] || 'fa-solid fa-clipboard-list') + '"></i></span>' +
        '<div class="gc-hm"><h3 class="gc-title">' + pnEsc(r.titulo || r.tipo) + '</h3>' +
        '<div class="gc-sub"><span class="gc-id">' + pnEsc(id) + '</span><span>' + pnEsc(pnDataLonga(r.dataEnvio)) + '</span></div></div>' +
        '<span class="gc-pill">' + pnEsc(est) + '</span></header>' +
        '<div class="gc-body"><aside class="gc-side"><div class="gc-ava"><img src="' + pnAvatar(autor, true) + '" alt="" loading="lazy"></div>' +
        '<div class="gc-who">' + pnEsc(autor) + '</div><div class="gc-role">Solicitante</div>' + acts + '</aside>' +
        '<section class="gc-main">' + gcGrupos(r.campos || {}) + gcDecisao(r, est) + gcPostagens(r) + gcHistorico(id, r) + '</section></div></article>';
}

function pnDesenhar() {
    var lista = document.getElementById('pnLista');
    if (!lista) return;

    var todos = Object.keys(pnData).filter(function (id) {
        var reg = pnData[id];
        return pnNorm(reg.tipo) !== 'form12' && pnNorm(reg.titulo) !== pnNorm(formTitles.form12);
    }).sort(function (a, b) { return (pnData[b].dataEnvio || 0) - (pnData[a].dataEnvio || 0); });

    /* resumo (contagem por status) */
    var cont = { Todos: todos.length };
    cont[PN_ST.PEN] = 0; cont[PN_ST.APR] = 0; cont[PN_ST.REC] = 0; cont[PN_ST.CAN] = 0;
    todos.forEach(function (id) { cont[pnEstado(pnData[id].status)]++; });
    var chips = [['Todos', 'Todos', ''], [PN_ST.PEN, 'Pendentes', 'gs-Pendente'], [PN_ST.APR, 'Aprovados', 'gs-Aprovado'], [PN_ST.REC, 'Reprovados', 'gs-Recusado'], [PN_ST.CAN, 'Cancelados', 'gs-Cancelado']];
    document.getElementById('gpSum').innerHTML = chips.map(function (c) {
        return '<button type="button" class="gp-chip ' + c[2] + (pnFiltro === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' +
            '<span class="ci"><i class="fa-solid ' + PN_ICONES_ST[c[0]] + '"></i></span><span class="cc"><b>' + cont[c[0]] + '</b><span>' + c[1] + '</span></span></button>';
    }).join('');

    /* tipos presentes */
    var tipos = {};
    todos.forEach(function (id) { var t = pnData[id].titulo; if (t) tipos[t] = 1; });
    var sel = document.getElementById('gpTipo');
    var opts = '<option value="">Todos os tipos</option>' + Object.keys(tipos).sort().map(function (t) {
        return '<option value="' + pnEsc(t) + '"' + (pnTipo === t ? ' selected' : '') + '>' + pnEsc(t) + '</option>';
    }).join('');
    if (sel.dataset.sig !== opts) { sel.innerHTML = opts; sel.dataset.sig = opts; }
    sel.value = pnTipo;

    /* filtros */
    var vis = todos.filter(function (id) {
        var r = pnData[id];
        if (pnFiltro !== 'Todos' && pnEstado(r.status) !== pnFiltro) return false;
        if (pnTipo && r.titulo !== pnTipo) return false;
        if (pnBusca) {
            var alvo = pnNorm([id, r.autor, r.titulo, r.avaliador, [].concat(r.nicknames || []).join(' ')].join(' '));
            if (alvo.indexOf(pnBusca) === -1) return false;
        }
        return true;
    });

    lista.innerHTML = vis.map(function (id) { return pnCard(id, pnData[id]); }).join('') ||
        '<div class="gp-empty"><i class="fa-regular fa-folder-open"></i>Nenhum requerimento encontrado neste filtro.</div>';
}

/* ---- popup de motivo (reprovar / cancelar) ---- */
var gmEl = null, gmCtx = null;
function gmMontar() {
    gmEl = document.createElement('div');
    gmEl.className = 'gm';
    gmEl.innerHTML =
        '<div class="gm-box" role="dialog" aria-modal="true">' +
        '<div class="gm-hd"><span class="gm-ic"><i class="fa-solid fa-triangle-exclamation"></i></span><div><div class="gm-tt"></div><div class="gm-sub"></div></div></div>' +
        '<div class="gm-bd"><label for="gmMot">Motivo (obrigatório)</label><textarea id="gmMot" maxlength="300" placeholder="Descreva o motivo..."></textarea><div class="gm-cnt">0/300</div></div>' +
        '<div class="gm-warn" id="gmWarn" style="display:none">Ao cancelar, o requerimento é finalizado e nada mais poderá ser alterado.</div>' +
        '<div class="gm-ft"><button type="button" class="gm-no">Voltar</button><button type="button" class="gm-yes">Confirmar</button></div></div>';
    document.body.appendChild(gmEl);
    var ta = gmEl.querySelector('#gmMot');
    ta.addEventListener('input', function () {
        gmEl.querySelector('.gm-cnt').textContent = ta.value.length + '/300';
        ta.classList.remove('campo-erro');
    });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) gmConfirmar(); });
    gmEl.querySelector('.gm-no').addEventListener('click', gmFechar);
    gmEl.querySelector('.gm-yes').addEventListener('click', gmConfirmar);
    gmEl.addEventListener('click', function (e) { if (e.target === gmEl) gmFechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gmEl.classList.contains('open')) gmFechar(); });
}
function gmAbrir(id, a) {
    if (!gmEl) gmMontar();
    var rec = a === 'rec', r = pnData[id] || {};
    gmCtx = { id: id, a: a };
    gmEl.style.setProperty('--b', rec ? 'var(--err)' : 'var(--gld)');
    gmEl.querySelector('.gm-tt').textContent = rec ? 'Reprovar requerimento' : 'Cancelar decisão';
    gmEl.querySelector('.gm-sub').textContent = id + ' · ' + (r.titulo || '');
    gmEl.querySelector('.gm-yes').textContent = rec ? 'Reprovar' : 'Cancelar decisão';
    gmEl.querySelector('#gmWarn').style.display = rec ? 'none' : 'block';
    var ta = gmEl.querySelector('#gmMot');
    ta.value = ''; ta.classList.remove('campo-erro');
    gmEl.querySelector('.gm-cnt').textContent = '0/300';
    gmEl.classList.add('open');
    setTimeout(function () { ta.focus(); }, 40);
}
function gmFechar() { if (gmEl) gmEl.classList.remove('open'); gmCtx = null; }
function gmConfirmar() {
    if (!gmCtx) return;
    var ta = gmEl.querySelector('#gmMot'), mot = ta.value.trim();
    if (!mot) {
        ta.classList.remove('campo-erro'); void ta.offsetWidth; ta.classList.add('campo-erro'); ta.focus();
        return showToast('Motivo obrigatório', 'Informe o motivo para continuar.', 'err');
    }
    var c = gmCtx;
    gmFechar();
    pnDecidir(c.id, c.a === 'rec' ? PN_ST.REC : PN_ST.CAN, mot);
}

function pnClique(e) {
    var b = e.target.closest('.gc-btn[data-a]');
    if (!b || !pnMe) return;
    var id = b.closest('.gc').dataset.id, a = b.dataset.a;
    if (a === 'apr') return pnDecidir(id, PN_ST.APR, '');
    gmAbrir(id, a);
}

/* Uma única atualização atômica; as rules validam a transição no servidor */
function pnDecidir(id, acao, motivo) {
    if (pnBusy[id]) return;
    var atual = pnEstado((pnData[id] || {}).status);
    if (acao === PN_ST.CAN ? (atual !== PN_ST.APR && atual !== PN_ST.REC) : atual !== PN_ST.PEN) {
        return showToast('Não alterado', 'Este requerimento já foi decidido ou finalizado.', 'err');
    }
    pnBusy[id] = true; pnDesenhar();
    var base = 'requerimentos/' + id + '/', up = {};
    up[base + 'status'] = acao;
    up[base + 'avaliador'] = pnMe.nick;
    up[base + 'cargoAvaliador'] = pnMe.cargo;
    up[base + 'dataAtualizacao'] = Date.now();
    if (acao === PN_ST.REC) { up[base + 'motivo'] = motivo; up[base + 'obs'] = motivo; }
    else if (acao === PN_ST.CAN) { up[base + 'motivoCancelamento'] = motivo; up[base + 'obs'] = motivo; }
    else { up[base + 'obs'] = null; }
    var hk = firebaseDb.ref(base + 'historico').push().key;
    var hi = { acao: acao, por: pnMe.nick, cargo: pnMe.cargo, em: Date.now() };
    if (acao !== PN_ST.APR) hi.motivo = motivo;
    up[base + 'historico/' + hk] = hi;

    firebaseDb.ref().update(up).then(function () {
        pnBusy[id] = false;
        showToast(acao, id + ' atualizado.', 'ok'); pnDesenhar();
    }).catch(function (err) {
        pnBusy[id] = false;
        showToast('Não alterado', 'Outro gestor já alterou ou sem permissão (' + (err.code || err.message) + ').', 'err'); pnDesenhar();
    });
}

document.addEventListener('DOMContentLoaded', iniciarPainel);

/* =====================================================================
   SELO DE VEREDITO (iframe do post: /h5-teste?status=REQxx)
   Fundo transparente + cartão próprio, para parecer parte do post.
   O iframe ajusta a própria altura (mesma origem do fórum).
   ===================================================================== */
function iniciarSeloStatus(id) {
    var st = document.createElement('style');
    st.textContent = `
html,body{background:transparent!important;background-image:none!important;min-height:0!important;margin:0!important;overflow:hidden!important}
body{padding:2px!important}
.page-wrap,.loading-overlay,.toast,.gm{display:none!important}
#insSelo{--bst:#f59e0b;position:relative;display:flex;align-items:center;gap:16px;box-sizing:border-box;width:100%;padding:14px 18px;overflow:hidden;color:#f1f5f9;font-family:'Inter',system-ui,sans-serif;line-height:1.4;
 background:radial-gradient(120% 160% at 0% 0%,color-mix(in srgb,var(--bst) 16%,transparent),transparent 55%),linear-gradient(135deg,#131c31,#0c1324);
 border:1px solid color-mix(in srgb,var(--bst) 38%,#26314a);border-radius:16px;box-shadow:0 6px 18px rgba(2,6,23,.35)}
#insSelo::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--bst)}
#insSelo[data-st="Aprovado"]{--bst:#10b981}#insSelo[data-st="Recusado"]{--bst:#ef4444}#insSelo[data-st="Cancelado"]{--bst:#64748b}
#insSelo .ic{position:relative;flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--bst);background:color-mix(in srgb,var(--bst) 15%,transparent);border:1px solid color-mix(in srgb,var(--bst) 50%,transparent)}
#insSelo[data-st="Pendente"] .ic::after{content:"";position:absolute;inset:-5px;border-radius:17px;border:2px solid var(--bst);opacity:0;animation:insPulse 2s ease-out infinite}
@keyframes insPulse{0%{transform:scale(.9);opacity:.55}100%{transform:scale(1.18);opacity:0}}
#insSelo .m{min-width:0;flex:1}
#insSelo .t{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px}
#insSelo .i{padding:2px 9px;border-radius:7px;background:rgba(148,163,184,.12);border:1px solid rgba(148,163,184,.22);font:800 12px 'Space Grotesk',sans-serif;letter-spacing:.4px;color:#cbd5e1}
#insSelo .n{font:700 15px 'Space Grotesk',sans-serif;color:#f8fafc;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#insSelo .p{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 13px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--bst);background:color-mix(in srgb,var(--bst) 14%,transparent);border:1px solid color-mix(in srgb,var(--bst) 55%,transparent);white-space:nowrap}
#insSelo .p::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--bst)}
#insSelo .l{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;margin-top:8px;font-size:12.5px;color:#94a3b8}
#insSelo .l img{width:24px;height:24px;border-radius:50%;object-fit:cover;object-position:center 15%;background:#1e293b;border:1px solid rgba(148,163,184,.25)}
#insSelo .l b{color:#e2e8f0;font-weight:700}
#insSelo .l .d{opacity:.55}
#insSelo .o{margin-top:8px;padding:8px 11px;border-radius:10px;font-size:12.5px;color:#cbd5e1;background:rgba(2,6,23,.4);border:1px solid rgba(148,163,184,.14);word-break:break-word}
#insSelo .o b{color:var(--bst);font-weight:700}
#insSelo .l:empty,#insSelo .o:empty{display:none}
@media(max-width:420px){#insSelo{padding:12px 14px;gap:12px}#insSelo .ic{flex-basis:38px;width:38px;height:38px;font-size:16px}#insSelo .p{margin-left:0}}
`;
    document.head.appendChild(st);

    var box = document.createElement('div');
    box.id = 'insSelo';
    box.setAttribute('data-st', 'Pendente');
    box.innerHTML = '<div class="ic"><i class="fa-solid fa-hourglass-half"></i></div>' +
        '<div class="m"><div class="t"><span class="i"></span><span class="n">Requerimento</span><span class="p">Carregando...</span></div>' +
        '<div class="l"></div><div class="o"></div></div>';
    document.body.appendChild(box);
    var elI = box.querySelector('.i'), elN = box.querySelector('.n'), elP = box.querySelector('.p'),
        elL = box.querySelector('.l'), elO = box.querySelector('.o'), elIc = box.querySelector('.ic i');
    elI.textContent = id;

    function fit() {
        try {
            var h = Math.ceil(box.getBoundingClientRect().height) + 6;
            var fe = window.frameElement;
            if (fe) { fe.style.height = h + 'px'; fe.setAttribute('height', h); }
        } catch (e) { }
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
    window.addEventListener('load', fit);

    function render(v) {
        v = v || {};
        var s = pnEstado(v.status), dec = s !== PN_ST.PEN;
        box.setAttribute('data-st', s);
        elIc.className = 'fa-solid ' + PN_ICONES_ST[s];
        elP.textContent = s;
        if (v.titulo) elN.textContent = v.titulo;

        var l = '';
        if (dec && v.avaliador) {
            l = '<img src="' + pnAvatar(v.avaliador, false) + '" alt=""><span>' + (s === PN_ST.APR ? 'Aprovado' : s === PN_ST.REC ? 'Reprovado' : 'Cancelado') +
                ' por <b>' + pnEsc(v.avaliador) + '</b>' + (v.cargoAvaliador ? ' (' + pnEsc(v.cargoAvaliador) + ')' : '') + '</span>' +
                (v.dataAtualizacao ? '<span class="d">•</span><span>' + pnEsc(pnDataLonga(v.dataAtualizacao)) + '</span>' : '');
        } else if (!dec) {
            l = '<span>Aguardando análise do ministério</span>';
        }
        elL.innerHTML = l;

        var mot = v.motivoCancelamento || v.motivo || (dec ? v.obs : '');
        elO.innerHTML = mot ? '<b>Motivo:</b> ' + pnEsc(mot) : '';
        fit();
    }

    if (!firebaseDb) { elP.textContent = 'Indisponível'; return; }
    firebaseDb.ref('requerimentos/' + id).on('value',
        function (snap) { render(snap.val()); },
        function () { elP.textContent = 'Indisponível'; });
}
if (INS_STATUS_ID) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { iniciarSeloStatus(INS_STATUS_ID); });
    else iniciarSeloStatus(INS_STATUS_ID);
}

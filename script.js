
let activeForm = null, isUserLoggedIn = false, currentUser = null, usuarioLogado = null, subgruposSelecionados = [], firebaseDb = null;


const formTitles = {
    form1:"Entrada de membros",form2:"Expulsao",form3:"Licenca/Reserva",form4:"Promocao",
    form5:"Rebaixamento",form6:"Saida",form7:"Prolongamento de licenca",form8:"Retorno de licenca",
    form9:"Migracao de corpo",form10:"Transferencia de conta",form11:"Reintegracao",
    form12:"Atualizacao da listagem",form13:"Observacao/Advertencia",form14:"Capacitacao"
};
const formIcons = {
    form1:"fa-solid fa-user-plus",form2:"fa-solid fa-ban",form3:"fa-solid fa-calendar-days",
    form4:"fa-solid fa-arrow-up",form5:"fa-solid fa-arrow-down",form6:"fa-solid fa-right-from-bracket",
    form7:"fa-solid fa-clock-rotate-left",form8:"fa-solid fa-rotate-left",form9:"fa-solid fa-right-left",
    form10:"fa-solid fa-retweet",form11:"fa-solid fa-rotate-left",form12:"fa-solid fa-list",
    form13:"fa-solid fa-triangle-exclamation",form14:"fa-solid fa-graduation-cap"
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
    const activeLi = document.querySelector('.req-nav-list li[data-form="'+formId+'"]');
    if (activeLi) activeLi.classList.add('active');
    const mobileSelect = document.getElementById('reqSelectMobile');
    if (mobileSelect) mobileSelect.value = formId;
}

window.addEventListener('load', function() {
    setTimeout(function() {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        setTimeout(function() { loader.style.display = 'none'; }, 500);
    }, 500);
});

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
    el.addEventListener('click', function() {
        const threadId = this.getAttribute('data-thread');
        const label = this.getAttribute('data-label');
        const formId = this.closest('.req-form').id;
        const permissoesContainer = formId === 'form3' ? document.getElementById('subgruposPermissoes') :
            formId === 'form7' ? document.getElementById('subgruposPermissoesForm7') : null;
        this.classList.toggle('selected');
        if (this.classList.contains('selected')) {
            subgruposSelecionados.push({threadId,label});
            if (permissoesContainer) {
                const input = document.createElement('input');
                input.type = 'text'; input.placeholder = 'Permissao ('+label+')';
                input.classList.add('subgruposPermissaoInput'); input.dataset.thread = threadId;
                permissoesContainer.appendChild(input);
            }
        } else {
            subgruposSelecionados = subgruposSelecionados.filter(sg => sg.threadId !== threadId);
            if (permissoesContainer) {
                const inputToRemove = permissoesContainer.querySelector('input[data-thread="'+threadId+'"]');
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
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
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

function aplicarTema(t) {
    document.documentElement.setAttribute("data-theme",t);
    const ic = document.getElementById("themeIcon"), lb = document.getElementById("themeLabel");
    if (ic) ic.className = t === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    if (lb) lb.textContent = t === "dark" ? "Tema claro" : "Tema escuro";
    try { localStorage.setItem("ins_tema",t); } catch(e){}
}
function toggleTheme() {
    aplicarTema(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
(function(){
    let t = null;
    try { t = localStorage.getItem("ins_tema"); } catch(e){}
    if (!t) t = (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    document.documentElement.setAttribute("data-theme",t);
    document.addEventListener("DOMContentLoaded",function(){ aplicarTema(t); });
})();

async function pegarUsername() {
    try {
        let resposta = await fetch("/forum");
        let html = await resposta.text();
        let regex = /_userdata\["username"\]\s*=\s*"([^"]+)"/;
        let match = html.match(regex);
        if (match && match[1] && match[1] !== 'null' && match[1] !== '' && match[1].toLowerCase() !== 'anonymous') {
            isUserLoggedIn = true; currentUser = match[1]; usuarioLogado = match[1];
            removeLoginLocks(); return match[1];
        } else { isUserLoggedIn = false; applyLoginLocks(); return null; }
    } catch(err) { isUserLoggedIn = false; applyLoginLocks(); return null; }
}
function removeLoginLocks() {}
function applyLoginLocks() {}

async function montarBarraUsuario() {
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
} catch(e){}

function fmtDataBR(d) {
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
 
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

/* === MUDANÇA 1: Firebase com ID sequencial e status Pendente === */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function gerarIdRequerimento() {
    if (!firebaseDb) return null;
    const contadorRef = firebaseDb.ref("contador_requerimentos");
    return new Promise((resolve, reject) => {
        contadorRef.transaction(function(current) {
            return (current || 0) + 1;
        }, function(error, committed, snapshot) {
            if (error) { reject(error); return; }
            if (!committed) { reject(new Error("Contador travado")); return; }
            const numero = snapshot.val();
            const idReq = "REQ" + String(numero).padStart(2, "0");
            resolve(idReq);
        });
    });
}

async function registrarRequerimento(formId, dados, bbcodeMessage) {
    if (!firebaseDb) return null;
    try {
        const idReq = await gerarIdRequerimento();
        const autorNick = currentUser || usuarioLogado || "Desconhecido";
        const registro = {
            id: idReq,
            tipo: formId,
            titulo: formTitles[formId] || formId,
            status: "Pendente",
            dataEnvio: Date.now(),
            dataFormatada: retorna_horario(),
            autor: autorNick,
            autorAvatar: autorNick ? "https://www.habbo.com.br/habbo-imaging/avatarimage?user=" + encodeURIComponent(autorNick) + "&action=std&direction=2&head_direction=3&gesture=sml&size=m" : "",
            nicknames: dados.nicknames || [],
            campos: dados,
            bbcode: bbcodeMessage,
            postagens: {}
        };
        await firebaseDb.ref("requerimentos/" + idReq).set(registro);
        return idReq;
    } catch (e) {
        return null;
    }
}

async function atualizarStatusRequerimento(idReq, status) {
    if (!firebaseDb || !idReq) return;
    await firebaseDb.ref("requerimentos/" + idReq + "/status").set(status).catch(()=>{});
}

/* === MUDANÇA 2: Envio sequencial ao fórum com retry anti-flood === */
async function postarNoForum(threadId, mensagem, tentativa) {
    tentativa = tentativa || 1;
    const maxTentativas = 3;
    const delayFlood = 15000;
    try {
        const resposta = await $.post("/post", { t: threadId, message: mensagem, mode: "reply", post: 1 });
        if (typeof resposta === "string") {
            const flood = resposta.includes("Você não pode postar outra mensagem tão rapidamente") ||
                          resposta.includes("O controle do flood esta ativo neste forum") ||
                          resposta.includes("flood");
            const sessao = resposta.includes('<form id="login"') || resposta.includes("Voce nao pode responder");
            if (flood && tentativa < maxTentativas) {
                await delay(delayFlood);
                return postarNoForum(threadId, mensagem, tentativa + 1);
            }
            if (flood) return { sucesso: false, threadId, erro: "Flood control (max retries)" };
            if (sessao) return { sucesso: false, threadId, erro: "Sessão expirada" };
        }
        return { sucesso: true, threadId };
    } catch (err) {
        return { sucesso: false, threadId, erro: "Erro de conexão" };
    }
}

async function enviarParaTopicos(destinos, mensagem) {
    const resultados = [];
    for (let i = 0; i < destinos.length; i++) {
        if (i > 0) await delay(8000);
        const res = await postarNoForum(destinos[i], mensagem);
        resultados.push(res);
    }
    return resultados;
}

function gerarIframeStatus(idReq) {
    var base = firebaseConfig.databaseURL + '/requerimentos/' + idReq;
    var css = "body{margin:0;font-family:Segoe UI,Arial,sans-serif}" +
        ".b{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:14px;background:#00529e;color:#fff;box-sizing:border-box}" +
        ".id{font-weight:800;font-size:15px}" +
        ".s{padding:4px 14px;border-radius:99px;font-weight:700;font-size:12px;background:#f59e0b}" +
        ".s.Aprovado{background:#10b981}.s.Recusado{background:#ef4444}.s.Em-analise{background:#6366f1}.s.Cancelado{background:#6b7280}" +
        ".o{font-size:12px;opacity:.9;flex-basis:100%}";
    var js = "var B='" + base + "',ID='" + idReq + "';" +
        "function g(k){return fetch(B+'/'+k+'.json').then(function(r){return r.json()})}" +
        "function u(){Promise.all([g('status'),g('obs'),g('avaliador')]).then(function(v){" +
        "var s=v[0]||'Pendente',c=s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/ /g,'-');" +
        "var e=document.getElementById('b');e.textContent='';" +
        "var a=document.createElement('span');a.className='id';a.textContent=ID;" +
        "var p=document.createElement('span');p.className='s '+c;p.textContent=s;" +
        "e.appendChild(a);e.appendChild(p);" +
        "if(v[1]||v[2]){var o=document.createElement('span');o.className='o';o.textContent=(v[2]?'Por '+v[2]+'. ':'')+(v[1]?'Motivo: '+v[1]:'');e.appendChild(o)}" +
        "}).catch(function(){})}" +
        "u();setInterval(u,30000);";
    var doc = "<!DOCTYPE html><html><head><meta charset='utf-8'><style>" + css + "</style></head>" +
        "<body><div class='b' id='b'>Carregando status...</div><script>" + js + "<\/script></body></html>";
    return '<iframe srcdoc="' + doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" width="100%" height="90" frameborder="0" scrolling="no"></iframe>';
}

function gatherFormData() {
    if (!activeForm) return "";
    const formId = activeForm.id;
    const buildCard = (title,content) => {
        const header = '[table          bgcolor="00529e" style="border-radius: 14px 14px 0px 0px; overflow: hidden; width: 35%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][color=#f8f8ff][size=18][b][font=Poppins][url=https://servimg.com/view/20530675/8][img]https://i.servimg.com/u/f76/20/53/06/75/3gw3ye10.png[/img][/url]\n'+title+'[/font][/b][/size][/color][/td][/tr][/table]';
        const bodyStart = '[table          bgcolor="#f8f8ff" style="border-radius: 0px 16px 16px 16px; overflow: hidden; width: 60%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td][left][font=Poppins][size=13]';
        return header + bodyStart + content + '[/size][/font][/left][/td][/tr][/table]';
    };

    if (formId === "form12") {
        var attlist_tag_value = $("#attlist_tag").val();
        return '[font=Poppins][center][table style="border: none!important; overflow: hidden; border-radius: 20px; line-height: 1.2em; width: 74%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2)" bgcolor="00529e"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"][img(16px,16px)]https://2img.net/i.imgur.com/7Rfeuel.png[/img]\n\n[img]https://2img.net/i.imgur.com/ByuqeKm.png[/img]\n[color=white][size=18][b][INS] Atualizacao realizada! ['+attlist_tag_value+'] [/size][/b]\n\n[size=11]Foi realizada uma atualizacao neste horario, em caso de erros, consulte um membro do ministerio da Companhia dos Instrutores.[/color][/size]\n[/td][/tr][/table][/center][/font]';
    }

        if (formId === "form1") {
        const nickInput = activeForm.querySelector('input[name="nick_ent"]');
        const nicks = nickInput ? nickInput.value.trim() : "";
        let inner = "";
        if (nicks) {
            const lines = nicks.split("/").map(s => s.trim()).filter(Boolean);
            lines.forEach(line => {
                inner += '[font=Poppins][b][color=#000000]' + line + '[/color][/b][/font]\n';
            });
        }
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
        const monthToday = today.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
        const formattedToday = String(today.getDate()).padStart(2,'0') + " " + monthToday.charAt(0).toUpperCase()+monthToday.slice(1) + " " + today.getFullYear();
        const futureDate = new Date(today); futureDate.setDate(today.getDate()+30);
        const monthFuture = futureDate.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
        const formattedFutureDate = String(futureDate.getDate()).padStart(2,'0') + " " + monthFuture.charAt(0).toUpperCase()+monthFuture.slice(1) + " " + futureDate.getFullYear();
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
            const dias = parseInt(diasInput.value.trim(),10);
            if (!isNaN(dias)) {
                const hoje = new Date(); const final = new Date(); final.setDate(hoje.getDate()+dias);
                const formatarData = data => {
                    const dia = String(data.getDate()).padStart(2,'0');
                    const mes = data.toLocaleString('pt-BR',{month:'short'}).replace('.','');
                    return dia + " " + mes.charAt(0).toUpperCase()+mes.slice(1) + " " + data.getFullYear();
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
                    const inputPerm = activeForm.querySelector('input[data-thread="'+sg.getAttribute('data-thread')+'"]');
                    const permValue = inputPerm ? inputPerm.value.trim() : "";
                    inner += "- " + label + (permValue ? " (Permissao: "+permValue+")" : "") + "\n";
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
                    const dateParts = value.split("-"); formattedValue = dateParts[2]+"/"+dateParts[1]+"/"+dateParts[0];
                }
                if (input.tagName.toLowerCase() === "select") {
                    placeholder = input.options[0].innerText;
                    formattedValue = input.options[input.selectedIndex].innerText;
                }
                if (placeholder === "TAG") {
                    const lines = formattedValue.split(" / ");
                    lines.forEach(line => placeholdersData += '[font=Poppins][b][color=#000000]'+line+'[/color][/b][/font]\n');
                } else placeholdersData += "[b]"+placeholder+"[/b]: "+formattedValue+"\n";
            }
        }
    });
    inner += placeholdersData;
    if (formId === "form1" || formId === "form2" || formId === "form6" || formId === "form11") {
        const today = new Date();
        inner += "[b]Data:[/b] " + String(today.getDate()).padStart(2,"0") + "/" + String(today.getMonth()+1).padStart(2,"0") + "/" + today.getFullYear() + "\n";
    }
    const checkboxes = activeForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) inner += '[color=#00529e][b]☒[/b][/color] ' + checkbox.nextElementSibling.innerText.trim() + "\n";
    });
    return buildCard(title, inner);
}

function enviarmp() {
    const mpTemplates = {
        "Avaliador": `[center][table    bgcolor="00529e" style="border-radius: 23px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][img]https://2img.net/i.imgur.com/n3Y0d1g.gif[/img]

[center][table    bgcolor="#f8f8ff" style="border-radius: 16px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][font=Poppins][center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][color=#f8f8ff][size=18][b]CARTA DE PROMOÇÃO[/b][/size][/color][/td][/tr][/table][/center]

Saudações, [b][color=#00529e]instrutor[/color] {USERNAME}[/b]!

Através desta mensagem privada, notificamos que você foi promovido ao cargo de [b]avaliador[/b] da companhia dos [b][color=#00529e]Instrutores[/color][/b] e possui [b]7 dias[/b] para realizar a [b]capacitação avançada[/b]. 

[b]Parabéns pela sua conquista![/b]

[center][table    bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td]Essa Mensagem Privada tem como objetivo passar informações imprescindíveis para a continuidade do seu crescimento na companhia, além de orientações sobre sua nova função, metas, gratificações, manuseio do subfórum dos avaliadores, e atualização de tarefas.[/td][/tr][/table][/center]

[center][table    bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]INFORMATIVO SOBRE SUA NOVA FUNÇÃO[/b][/color][/td][/tr][/table][/center]

[justify]Os avaliadores são responsáveis por avaliar, através da utilização de contas fakes, as instruções aplicadas por qualquer instrutor, garantindo que todas as normas e regras estejam sendo seguidas em suas aplicações.[/justify]

Os Avaliadores devem realizar [b]02 avaliações[/b] ou [b]03 CCI[/b] semanalmente, sendo que:

[table         bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][size=13][b][color=#00529e]➥[/color][/b] O avaliador que atingir 06 pontos ou mais na meta semanal, receberá 10 medalhas efetivas.
[b][color=#00529e]➥[/color][/b] O avaliador que atingir 05 pontos ou menos na meta semanal, receberá 10 medalhas efetivas negativas.[/size][/td][/tr][/table][/td][/tr][/table][/center]

[center][table    bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]MANUSEIO DO SUBFÓRUM[/b][/color][/td][/tr][/table][/center]

[justify][url=https://www.policiarcc.com/t20340-ins-formacao-dos-avaliadores][b][color=#00529e][INS] Script de Formação dos Avaliadores[/color][/b][/url] - Tópico que dispõe o slide com todas as informações do cargo de avaliador. Após ser adicionado no subfórum dos avaliadores, é imprescindível que realize a leitura do documento.

[url=https://www.policiarcc.com/t26353-ins-relatorios-de-postagens][b][color=#00529e][INS] Relatórios de Postagens[/color][/b][/url] - Tópico que dispõe os links para postagem, verificação de avaliações e retificação de erros.

[url=https://www.policiarcc.com/t35887-ins-relatorio-de-fakes][b][color=#00529e][INS] Relatório de Fakes[/color][/b][/url] - Tópico que dispõe o formulário para registro dos nicknames das fakes utilizadas em suas avaliações de instrução.[/justify][/td][/tr][/table][/center]

[center][table    bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]PLANO DE CARREIRA E ATUALIZAÇÃO DE TAREFAS[/b][/color][/td][/tr][/table][/center]

[justify]Para transmitir conhecimento aos instrutores, é essencial manter a leitura regular das documentações da companhia. Para subir ao cargo de capacitador, você deverá cumprir suas metas com excelência e estar de acordo com as informações supracitadas. A participação em subgrupos e a apresentação de projetos ou sugestões podem destacar você entre os demais membros, embora não sejam obrigatórios.

Caso você seja oficial do corpo militar ou oficial do corpo executivo portador da especialização intermediária, você tem um prazo de 48 horas para realizar sua atualização de tarefas no system da Polícia RCC.[/justify]

[center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 80%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Instrutor[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Instrutor[/b][/color][/td][td style="padding: 9px;"][color=#f8f8ff][b]Avaliador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Capacitador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Estagiário[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Ministro[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Vice-Líder[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Líder[/b][/color][/td][/tr][/table][/center]

[b]A identificação do seu novo cargo é [color=#00529e]Av.INS[/color][/b][/td][/tr][/table][/center]

[center][table    bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table    bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]REDES SOCIAIS[/b][/color][/td][/tr][/table][/center]

Para estabelecer um melhor contato entre os membros da companhia, acompanhe-nos em nossas redes sociais:

[center][table    bgcolor="25d366" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/BlW6wlS.png[/img][/sub] [url=https://chat.whatsapp.com/IHMALMSOb094FoJ8wmouOl][b][color=#f8f8ff]WhatsApp[/color][/b][/url][/td][/tr][/table][/center]

[center][table    bgcolor="7289da" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/4ilBcWB.png[/img][/sub] [url=https://discord.com/invite/jCdah8bwwt][b][color=#f8f8ff]Discord[/color][/b][/url][/td][/tr][/table][/center][/td][/tr][/table][/center][/td][/tr][/table][/center][/font]
[font=Poppins][size=12][color=#f8f8ff][b][img(10px,10px)]https://2img.net/i.imgur.com/GoqL8ud.png[/img] Reservam-se os direitos à Companhia dos Instrutores[/b][/size][/color][/font][/td][/tr][/table][/center]

[center][size=16][b]Para enviar o bbcode, [url=https://docs.google.com/document/d/109e2fT0S8sV9bC_j16dWWbWZ4Xi8jo5zWWLrl4lJ7ys/edit?usp=sharing]clique aqui e copie o código.[/url][/b][/size][/center]`,
        "Capacitador": `[center][table bgcolor="00529e" style="border-radius: 23px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][img]https://2img.net/i.imgur.com/n3Y0d1g.gif[/img]

[center][table bgcolor="#f8f8ff" style="border-radius: 16px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][font=Poppins][center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][color=#f8f8ff][size=18][b]CARTA DE PROMOÇÃO[/b][/size][/color][/td][/tr][/table][/center]

Saudações, [b][color=#00529e]instrutor[/color] {USERNAME}[/b]!

Através desta mensagem privada, notificamos que você foi promovido ao cargo de [b]capacitador[/b] da companhia dos [b][color=#00529e]Instrutores[/color][/b].

[b]Parabéns pela sua conquista![/b]

[center][table bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td]Abaixo encontram-se informações imprescindíveis para a continuidade do seu crescimento na companhia, além de orientações sobre sua nova função, metas, gratificações, manuseio do subfórum dos capacitadores e atualização de tarefas.[/td][/tr][/table][/center]

[center][table bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]INFORMATIVO SOBRE SUA NOVA FUNÇÃO[/b][/color][/td][/tr][/table][/center]

[justify]Os capacitadores têm um papel fundamental ao transmitir as informações iniciais aos novos instrutores que ingressarem na companhia através da capacitação, explicando o funcionamento do subfórum, aplicação de aulas, metas, TAG's, utilização do corredor, entre outros.[/justify]

Um capacitador precisa aplicar, no mínimo, [b]03 capacitações[/b] em sua meta quinzenal.

[table      bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][size=13][b][color=#00529e]➥[/color][/b] O capacitador que atingir 03 capacitações ou mais na meta quinzenal, receberá 25 medalhas efetivas.
[b][color=#00529e]➥[/color][/b] O capacitador que atingir 02 capacitações ou menos na meta quinzenal, receberá 25 medalhas efetivas negativas.[/size][/td][/tr][/table]
[/td][/tr][/table][/center]

[center][table bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]MANUSEIO DO SUBFÓRUM[/b][/color][/td][/tr][/table][/center]

[justify][url=https://www.policiarcc.com/t20341-ins-manual-de-formacao-dos-capacitadores][b][color=#00529e][INS] Script de Formação dos Capacitadores[/color][/b][/url] - Tópico que dispõe o slide com todas as informações do cargo de capacitador. Após ser adicionado no subfórum dos capacitadores, é imprescindível que realize a leitura do documento.

[url=https://www.policiarcc.com/t28978-ins-script-de-capacitacao-basica][b][color=#00529e][INS] Script de Capacitação Básica[/color][/b][/url] - Tópico que dispõe o script de Capacitação Básica, destinado aos novos instrutores.

[url=https://www.policiarcc.com/t37534-ins-script-de-capacitacao-avancada][b][color=#00529e][INS] Script de Capacitação Avançada[/color][/b][/url] - Tópico que dispõe o script de Capacitação Avançada, destinado aos novos avaliadores.

[url=https://www.policiarcc.com/t37535-ins-relatorios-de-postagens][b][color=#00529e][INS] Relatórios de Postagens[/color][/b][/url] - Tópico que dispõe os links para postagem, verificação de capacitações e retificação de erros.[/justify][/td][/tr][/table][/center]

[center][table bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]PLANO DE CARREIRA E ATUALIZAÇÃO DE TAREFAS[/b][/color][/td][/tr][/table][/center]

[justify]Para transmitir conhecimento aos instrutores, é essencial manter a leitura regular das documentações da companhia. Para subir ao cargo de estagiário, você deverá cumprir suas metas com excelência e estar de acordo com as informações supracitadas. A participação em subgrupos e a apresentação de projetos ou sugestões podem destacar você entre os demais membros, embora não sejam obrigatórios.

Caso você seja oficial do corpo militar ou oficial do corpo executivo portador da especialização intermediária, você tem um prazo de 48 horas para realizar sua atualização de tarefas no system da Polícia RCC.[/justify]

[center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 80%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Instrutor[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Avaliador[/b][/color][/td][td style="padding: 9px;"][color=#f8f8ff][b]Capacitador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Estagiário[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Ministro[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Vice-Líder[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Líder[/b][/color][/td][/tr][/table][/center]

[b]A identificação do seu novo cargo é [color=#00529e]Cap.INS[/color][/b][/td][/tr][/table][/center]

[center][table bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]REDES SOCIAIS[/b][/color][/td][/tr][/table][/center]

Para estabelecer um melhor contato entre os membros da companhia, acompanhe-nos em nossas redes sociais:

[center][table bgcolor="25d366" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/BlW6wlS.png[/img][/sub] [url=https://chat.whatsapp.com/IHMALMSOb094FoJ8wmouOl][b][color=#f8f8ff]WhatsApp[/color][/b][/url][/td][/tr][/table][/center]

[center][table bgcolor="7289da" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/4ilBcWB.png[/img][/sub] [url=https://discord.com/invite/jCdah8bwwt][b][color=#f8f8ff]Discord[/color][/b][/url][/td][/tr][/table][/center][/td][/tr][/table][/center][/td][/tr][/table][/center][/font]
[font=Poppins][size=12][color=#f8f8ff][b][img(10px,10px)]https://2img.net/i.imgur.com/GoqL8ud.png[/img] Reservam-se os direitos à Companhia dos Instrutores[/b][/size][/color][/font][/td][/tr][/table][/center]`,
        "Estagiário": `[center][table   bgcolor="00529e" style="border-radius: 23px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][img]https://2img.net/i.imgur.com/n3Y0d1g.gif[/img]

[center][table   bgcolor="#f8f8ff" style="border-radius: 16px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][font=Poppins][center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][color=#f8f8ff][size=18][b]CARTA DE PROMOÇÃO[/b][/size][/color][/td][/tr][/table][/center]

Saudações, [b][color=#00529e]instrutor[/color] {USERNAME}[/b]!

Através desta mensagem privada, notificamos que você foi promovido ao cargo de [b]estagiário[/b] da companhia dos [b][color=#00529e]Instrutores[/color][/b].

[b]Parabéns pela sua conquista![/b]

[center][table   bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td]Abaixo encontram-se informações imprescindíveis para a continuidade do seu crescimento na companhia, além de orientações sobre sua nova função, metas, gratificações, manuseio do subfórum do ministério e atualização de tarefas.[/td][/tr][/table][/center]

[center][table   bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]INFORMATIVO SOBRE SUA NOVA FUNÇÃO[/b][/color][/td][/tr][/table][/center]

[justify]Os estagiários têm um papel fundamental na manutenção das atividades internas, de maneira a apoiar diretamente a liderança na gestão da companhia, por meio de suas atribuições gerais e do contato com os membros, proporcionando o suporte necessário para o desenvolvimento do grupo de maneira geral.

Além disso, enquanto estagiário, você passará por um processo de aprendizagem e desenvolvimento, com a principal função de auxiliar os ministros em suas atividades administrativas. Esses são os ministérios pelos quais você poderá ser designado para auxiliar: Administração, Atualização, Contabilidade, Recursos Humanos, Segurança, Documentação.

Convém ressaltar que [b]as funções do estágio são rotativas[/b] conforme a escala vigente. Por isso, é importante que verifique a escala sempre que a semana começar, para saber onde estagiará no referido período.[/justify]

Um estagiário precisa, portanto, [b]cumprir as funções do estágio ministerial ao qual for designado[/b] em sua meta semanal.

[table        bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][size=13][b][color=#00529e]➥[/color][/b] O estagiário que cumprir suas atribuições na meta semanal, receberá 15 medalhas efetivas positivas.
[b][color=#00529e]➥[/color][/b] O estagiário que descumprir suas atribuições na meta semanal, receberá 15 medalhas efetivas negativas.[/size][/td][/tr][/table]
[/td][/tr][/table][/center]

[center][table   bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]MANUSEIO DO SUBFÓRUM[/b][/color][/td][/tr][/table][/center]

[center]Primeiramente, seguem os [b]tópicos da página inicial do subfórum do ministério[/b].[/center]

[justify][url=https://www.policiarcc.com/t28980-min-ins-modelos-de-notificacoes][b][color=#00529e][Min.INS] Modelos de Notificações[/color][/b][/url] - Tópico que dispõe de todos os modelos de notificações utilizados na companhia dos instrutores.

[url=https://www.policiarcc.com/t33149-min-ins-central-de-avaliacoes][b][color=#00529e][Min.INS] Central de Avaliações[/color][/b][/url] - Tópico que disponibiliza as avaliações semanais do ministério.

[url=https://www.policiarcc.com/t34348-ssi-registro-de-saidas-e-expulsoes][b][color=#00529e][SSI] Registro de Saídas e Expulsões[/color][/b][/url] - Tópico destinado ao controle de saídas e expulsões da companhia.

[url=https://www.policiarcc.com/t36596-min-ins-reunioes-ministeriais][b][color=#00529e][Min.INS] Reuniões Ministeriais[/color][/b][/url] - Tópico que disponibiliza o formulário de justificativas de presenças e atas das reuniões do ministério. Após ser adicionado ao subfórum do ministério, é imprescindível que realize a leitura deste documento.

[url=https://www.policiarcc.com/t37295-min-ins-escala-postagem-de-conclusao][b][color=#00529e][Min.INS] Escala & Postagem de conclusão[/color][/b][/url] - Tópico destinado a transparência de escala e postagem de conclusão de funções. Após ser adicionado ao subfórum do ministério, é imprescindível que realize a leitura deste documento.[/justify]

[center]Enfim, as [b]áreas do subfórum do ministério[/b], conforme apresentadas abaixo.[/center]

[justify][url=https://www.policiarcc.com/f603-ins-backups][b][color=#00529e][INS] Backups[/color][/b][/url] - Área destinada ao backup da lista de membros.

[url=https://www.policiarcc.com/f827-ins-manual-de-funcoes][b][color=#00529e][INS] Manual de Funções[/color][/b][/url] - Área destinada ao manual de funções do ministério da companhia dos instrutores. Após ser designado para determinado estágio, é imprescindível que realize a leitura do documento respectivo e inserido nesta área.

[url=https://www.policiarcc.com/f622-ins-diretrizes-ministeriais][b][color=#00529e][INS] Diretrizes Ministeriais[/color][/b][/url] - Área destinada às documentações do ministério. O conteúdo inserido nesta área é de leitura obrigatória, uma vez que se destina a outras obrigações internas que todo membro do ministério deve seguir.[/justify][/td][/tr][/table][/center]

[center][table   bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]PLANO DE CARREIRA E ATUALIZAÇÃO DE TAREFAS[/b][/color][/td][/tr][/table][/center]

[justify]Para transmitir conhecimento aos instrutores, é essencial manter a leitura regular das documentações da companhia. Para subir ao cargo de ministro, você deverá cumprir suas metas com excelência e estar de acordo com as informações supracitadas. A participação em subgrupos e a apresentação de projetos ou sugestões podem destacar você entre os demais membros, embora não sejam obrigatórios.

Caso você seja oficial do corpo militar ou oficial do corpo executivo portador da especialização intermediária, você tem um prazo de 48 horas para realizar sua atualização de tarefas no system da Polícia RCC.[/justify]

[center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 80%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Instrutor[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Avaliador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Capacitador[/b][/color][/td][td style="padding: 9px;"][color=#f8f8ff][b]Estagiário[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Ministro[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Vice-Líder[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Líder[/b][/color][/td][/tr][/table][/center]

[b]A identificação do seu novo cargo é [color=#00529e]Est.INS[/color][/b][/td][/tr][/table][/center]

[center][table   bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table   bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]REDES SOCIAIS[/b][/color][/td][/tr][/table][/center]

Para estabelecer um melhor contato entre os membros da companhia, acompanhe-nos em nossas redes sociais:

[center][table   bgcolor="25d366" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/BlW6wlS.png[/img][/sub] [url=https://chat.whatsapp.com/IHMALMSOb094FoJ8wmouOl][b][color=#f8f8ff]WhatsApp[/color][/b][/url][/td][/tr][/table][/center]

[center][table   bgcolor="7289da" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/4ilBcWB.png[/img][/sub] [url=https://discord.com/invite/jCdah8bwwt][b][color=#f8f8ff]Discord[/color][/b][/url][/td][/tr][/table][/center][/td][/tr][/table][/center][/td][/tr][/table][/center][/font]
[font=Poppins][size=12][color=#f8f8ff][b][img(10px,10px)]https://2img.net/i.imgur.com/GoqL8ud.png[/img] Reservam-se os direitos à Companhia dos Instrutores[/b][/size][/color][/font][/td][/tr][/table][/center]`,
        "Ministro": `[center][table     bgcolor="00529e" style="border-radius: 23px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][img]https://2img.net/i.imgur.com/n3Y0d1g.gif[/img]

[center][table     bgcolor="#f8f8ff" style="border-radius: 16px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][font=Poppins][center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][color=#f8f8ff][size=18][b]CARTA DE PROMOÇÃO[/b][/size][/color][/td][/tr][/table][/center]

Saudações, [b][color=#00529e]instrutor[/color] {USERNAME}[/b]!

Através desta mensagem privada, notificamos que você foi promovido ao cargo de [b]Ministro[/b] da Companhia dos [b][color=#00529e]Instrutores[/color][/b].

[b]Parabéns pela sua conquista![/b]

[center][table     bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td]Abaixo encontram-se informações imprescindíveis para a continuidade do seu crescimento na companhia, além de orientações sobre sua nova função, metas, gratificações, manuseio do subfórum do ministério e atualização de tarefas.[/td][/tr][/table][/center]

[center][table     bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]INFORMATIVO SOBRE SUA NOVA FUNÇÃO[/b][/color][/td][/tr][/table][/center]

[justify]Os ministros têm um papel fundamental na manutenção das atividades internas, de maneira a apoiar diretamente a liderança na gestão da companhia, por meio de suas atribuições gerais e do contato com os membros, proporcionando o suporte necessário para o desenvolvimento do grupo de maneira geral.

Além disso, enquanto ministro, você passará por um processo de desenvolvimento, com a principal função de auxiliar a Liderança em atividades administrativas e os membros da companhia. Esses são os ministérios aos quais você poderá ser designado: Administração, Atualização, Contabilidade, Recursos Humanos, Segurança, Documentação.

A Liderança decidirá sua atribuição e adicionar na escala ministerial, portanto, verifique frequentemente para garantir que está realizando todas suas funções.[/justify]

Um ministro precisa, portanto, [b]cumprir as funções ministeriais às quais for designado[/b] em sua meta semanal.

[table          bgcolor="9fc6ea" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 7px;"][size=13][b][color=#00529e]➥[/color][/b] O ministro que cumprir suas atribuições na meta semanal, receberá 15 medalhas efetivas positivas.
[b][color=#00529e]➥[/color][/b] O ministro que descumprir suas atribuições na meta semanal, receberá 15 medalhas efetivas negativas.[/size][/td][/tr][/table]
[/td][/tr][/table][/center]

[center][table     bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]MANUSEIO DO SUBFÓRUM[/b][/color][/td][/tr][/table][/center]

[center]Primeiramente, seguem os [b]tópicos da página inicial do subfórum do ministério[/b].[/center]

[justify][url=https://www.policiarcc.com/t28980-min-ins-modelos-de-notificacoes][b][color=#00529e][Min.INS] Modelos de Notificações[/color][/b][/url] - Tópico que dispõe de todos os modelos de notificações utilizados na companhia dos instrutores.

[url=https://www.policiarcc.com/t33149-min-ins-central-de-avaliacoes][b][color=#00529e][Min.INS] Central de Avaliações[/color][/b][/url] - Tópico que disponibiliza as avaliações semanais do ministério.

[url=https://www.policiarcc.com/t34348-ssi-registro-de-saidas-e-expulsoes][b][color=#00529e][SSI] Registro de Saídas e Expulsões[/color][/b][/url] - Tópico destinado ao controle de saídas e expulsões da companhia.

[url=https://www.policiarcc.com/t36596-min-ins-reunioes-ministeriais][b][color=#00529e][Min.INS] Reuniões Ministeriais[/color][/b][/url] - Tópico que disponibiliza o formulário de justificativas de presenças e atas das reuniões do ministério. Após ser adicionado ao subfórum do ministério, é imprescindível que realize a leitura deste documento.

[url=https://www.policiarcc.com/t37295-min-ins-escala-postagem-de-conclusao][b][color=#00529e][Min.INS] Escala & Postagem de conclusão[/color][/b][/url] - Tópico destinado a transparência de escala e postagem de conclusão de funções. Após ser adicionado ao subfórum do ministério, é imprescindível que realize a leitura deste documento.[/justify]

[center]Enfim, as [b]áreas do subfórum do ministério[/b], conforme apresentadas abaixo.[/center]

[justify][url=https://www.policiarcc.com/f603-ins-backups][b][color=#00529e][INS] Backups[/color][/b][/url] - Área destinada ao backup da lista de membros.

[url=https://www.policiarcc.com/f827-ins-manual-de-funcoes][b][color=#00529e][INS] Manual de Funções[/color][/b][/url] - Área destinada ao manual de funções do ministério da companhia dos instrutores. Após ser designado para determinado estágio, é imprescindível que realize a leitura do documento respectivo e inserido nesta área.

[url=https://www.policiarcc.com/f622-ins-diretrizes-ministeriais][b][color=#00529e][INS] Diretrizes Ministeriais[/color][/b][/url] - Área destinada às documentações do ministério. O conteúdo inserido nesta área é de leitura obrigatória, uma vez que se destina a outras obrigações internas que todo membro do ministério deve seguir.[/justify][/td][/tr][/table][/center]

[center][table     bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]PLANO DE CARREIRA E ATUALIZAÇÃO DE TAREFAS[/b][/color][/td][/tr][/table][/center]

[justify]Para transmitir conhecimento aos instrutores, é essencial manter a leitura regular das documentações da companhia. Para subir ao cargo de ministro, você deverá cumprir suas metas com excelência e estar de acordo com as informações supracitadas. A participação em subgrupos e a apresentação de projetos ou sugestões podem destacar você entre os demais membros, embora não sejam obrigatórios.

Caso você seja oficial do corpo militar ou oficial do corpo executivo portador da especialização intermediária, você tem um prazo de 48 horas para realizar sua atualização de tarefas no system da Polícia RCC.[/justify]

[center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 80%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Instrutor[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Avaliador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Capacitador[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Estagiário[/b][/color][/td][td style="padding: 9px;"][color=#f8f8ff][b]Ministro[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Vice-Líder[/b][/color][/td][td bgcolor="edf5fc" style="padding: 9px;"][color=#00529e][b]Líder[/b][/color][/td][/tr][/table][/center]

[b]A identificação do seu novo cargo é [color=#00529e]Min.INS[/color][/b][/td][/tr][/table][/center]

[center][table     bgcolor="edf5fc" style="border-radius: 14px; overflow: hidden; width: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td][center][table     bgcolor="00529e" style="border-radius: 14px 5px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][color=#f8f8ff][b]REDES SOCIAIS[/b][/color][/td][/tr][/table][/center]

Para estabelecer um melhor contato entre os membros da companhia, acompanhe-nos em nossas redes sociais:

[center][table     bgcolor="25d366" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/BlW6wlS.png[/img][/sub] [url=https://chat.whatsapp.com/IHMALMSOb094FoJ8wmouOl][b][color=#f8f8ff]WhatsApp[/color][/b][/url][/td][/tr][/table][/center]

[center][table     bgcolor="7289da" style="border-radius: 14px; overflow: hidden; width: 17%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);"][tr][td style="padding: 9px;"][sub][img(15px,15px)]https://2img.net/i.imgur.com/4ilBcWB.png[/img][/sub] [url=https://discord.com/invite/jCdah8bwwt][b][color=#f8f8ff]Discord[/color][/b][/url][/td][/tr][/table][/center][/td][/tr][/table][/center][/td][/tr][/table][/center][/font]
[font=Poppins][size=12][color=#f8f8ff][b][img(10px,10px)]https://2img.net/i.imgur.com/GoqL8ud.png[/img] Reservam-se os direitos à Companhia dos Instrutores[/b][/size][/color][/font][/td][/tr][/table][/center]`
    };

    const cargoSelecionado = document.querySelector('[name="cargo_pro2"]').value;
    const nomes = document.querySelector('[name="nick_pro"]').value.trim().split("/");
    if (!Object.keys(mpTemplates).includes(cargoSelecionado)) return;
    nomes.forEach(function(nickBruto) {
        const nick = nickBruto.trim();
        const mensagemFinal = mpTemplates[cargoSelecionado]?.replaceAll('{USERNAME}', nick);
        if (mensagemFinal) {
            $.post("/privmsg", { folder: "inbox", mode: "post", username: nick, subject: `[INS] Promocao a ${cargoSelecionado}`, message: mensagemFinal, post: 1 });
        }
    });
}

/* === MUDANÇA 3: Handler de submit async — Firebase primeiro, depois fórum === */
(function($) {
    $(window).on("load", function() {
        $(document).off("submit", "form").on("submit", "form", async function(event) {
            event.preventDefault();
            let isValid = true;
            $(this).find("input[required], textarea[required], select[required]").each(function() {
                if ($(this).val().trim() === "") {
                    isValid = false;
                    $(this).addClass("campo-erro");
                    setTimeout(() => $(this).removeClass("campo-erro"), 3000);
                }
            });
            if (!isValid) {
                showToast("Atenção", "Há campos obrigatórios vazios. Preencha todos antes de enviar.", "err");
                return;
            }

            const bbcodeBase = gatherFormData();
            if (!bbcodeBase) {
                showToast("Atenção", "Preencha todos os campos!", "err");
                return;
            }

            const botao = $(this).find("button[type='submit']");
            botao.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Registrando...');

            const formId = $(this).closest(".req-form").attr("id");
            const dadosEstruturados = extrairDadosEstruturados(formId, this);

            /* 1. Envia ao Firebase PRIMEIRO e obtém o ID */
            const idReq = await registrarRequerimento(formId, dadosEstruturados, bbcodeBase);
            if (!idReq) {
                showToast("Erro", "Falha ao registrar no Firebase. Tente novamente.", "err");
                botao.prop("disabled", false).html('<i class="fas fa-paper-plane"></i> Enviar requerimento');
                return;
            }

            /* Adiciona o ID e status no corpo do post */
            const idBadge = gerarIframeStatus(idReq);
            const bbcodeMessage = bbcodeBase + "\n\n" + idBadge;

            /* 2. Envia MP se for promoção */
            enviarmp();

            /* 3. Monta lista de destinos */
            let destinos = ["1"];
            if (formId === "form3" || formId === "form7" || formId === "form8") {
                const selectedSubgrupos = document.querySelectorAll('#'+formId+' .subgrupo.selected');
                selectedSubgrupos.forEach(sg => {
                    const threadId = sg.getAttribute("data-thread");
                    if (threadId) destinos.push(threadId);
                });
            }
            destinos = [...new Set(destinos)];

            botao.html('<i class="fas fa-spinner fa-spin"></i> Postando em ' + destinos.length + ' tópico(s)...');

            /* 4. Envia sequencialmente com anti-flood */
            const resultados = await enviarParaTopicos(destinos, bbcodeMessage);

            /* 5. Atualiza Firebase com resultados das postagens */
            if (firebaseDb && idReq) {
                const updates = {};
                resultados.forEach((res, idx) => {
                    updates[idx] = { threadId: res.threadId, sucesso: res.sucesso, erro: res.erro || null, data: Date.now() };
                });
                await firebaseDb.ref("requerimentos/" + idReq + "/postagens").set(updates).catch(()=>{});
            }

            botao.prop("disabled", false).html('<i class="fas fa-paper-plane"></i> Enviar requerimento');

            const erros = resultados.filter(r => !r.sucesso);
            if (erros.length > 0) {
                const msg = erros.map(e => e.threadId + ": " + e.erro).join(" | ");
                showToast("Atenção", "Alguns envios falharam: " + msg, "err");
            } else {
                showToast("Sucesso", "Requerimento " + idReq + " registrado e postado em todos os tópicos.", "ok");
                setTimeout(() => { location.href = "http://" + location.host + "/t1-?view=newest"; }, 1500);
            }
        });
    });
})(jQuery);

/* ================= PAINEL DE GESTÃO ================= */
/* Listagem (nicks e cargos): projeto antigo, SOMENTE LEITURA */

var LISTAGEM_CONFIG = { databaseURL: 'https://dashboardteste-73cc6-default-rtdb.firebaseio.com' };
var PN_ST = { PEN: 'Pendente', APR: 'Aprovado', REC: 'Recusado', CAN: 'Cancelado' };
var PN_CARGOS = { lider: 'Líder', viceLideres: 'Vice-Líder', ministros: 'Ministro', estagiarios: 'Estagiário' };
var PN_LABELS = {
    nicknames: 'Nickname(s)', cargoResultante: 'Cargo resultante', cargoAnterior: 'Cargo anterior/atual', cargoNovo: 'Novo cargo',
    cargo: 'Cargo', motivo: 'Motivo(s)', permissao: 'Permissão', permissaoCompanhia: 'Permissão (Companhia)', dias: 'Quantidade de dias',
    periodo: 'Período', subgrupos: 'Subgrupos', data: 'Data', dataRegistro: 'Data do registro', corpoDestino: 'Migrando para o',
    nicknameAtual: 'Nickname atual', novoNickname: 'Novo nickname', cargoAlcancado: 'Cargo alcançado', capacitacaoNecessaria: 'Capacitação',
    tipoAdvertencia: 'Tipo', tipoCapacitacao: 'Tipo de capacitação', termosAceitos: 'Termos aceitos', observacao: 'Observação'
};
var dbList = null, pnMe = null, pnData = {}, pnRef = null, pnMontado = false, pnDrafts = {}, pnAbertos = {}, pnBusy = {};
 
formTitles.painel = 'Painel de gestão';
formIcons.painel = 'fa-solid fa-table-list';
 
(function () {
    var st = document.createElement('style');
    st.textContent = '.s-Cancelado{background:#6b7280}.pn-grid{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:6px 14px;font-size:13px;margin:10px 0}' +
        '.pn-grid .k{font-weight:600;color:var(--txt2)}.pn-grid .v{word-break:break-word}' +
        '.pn-sep{grid-column:1/-1;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--txt3);margin-top:6px;border-top:1px solid var(--bdr-lt);padding-top:8px}' +
        '.pn-final{font-size:12px;color:var(--txt3);font-style:italic}';
    document.head.appendChild(st);
})();
 
function pnEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pnNorm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function pnCls(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-'); }
function pnEstado(s) { return (s === PN_ST.APR || s === PN_ST.REC || s === PN_ST.CAN) ? s : PN_ST.PEN; } /* "Em análise" antigo = Pendente */
function pnLabel(k) { return PN_LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); }
function pnDataHora(t) { return t ? new Date(t).toLocaleString('pt-BR') : '—'; }
 
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
    if (!window.firebase || !firebaseDb) return;
    try { dbList = firebase.initializeApp(LISTAGEM_CONFIG, 'listagem').database(); } catch (e) { return; }
    var nick = await pegarUsername();
    if (!nick) return;
    dbList.ref('listagem/atual/data').on('value', function (snap) {
        var cargo = pnCargo(snap.val() || {}, nick);
        var li = document.getElementById('navPainel'), op = document.getElementById('optPainel');
        if (!cargo) {
            pnMe = null; pnMontado = false; pnData = {};
            if (pnRef) { pnRef.off(); pnRef = null; }
            if (li) li.style.display = 'none';
            if (op) op.hidden = true;
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
        if (li) li.style.display = '';
        if (op) op.hidden = false;
        if (!pnMontado) pnMontar();
        else { var w = document.getElementById('pnWho'); if (w) w.innerHTML = pnEsc(cargo) + ' <b>' + pnEsc(nick) + '</b>'; }
    });
}
 
function pnMontar() {
    pnMontado = true;
    document.getElementById('painelRoot').innerHTML =
        '<div class="pn-bar"><input id="pnQ" placeholder="Buscar ID, nick ou tipo..." />' +
        '<select id="pnF"><option value="">Todos os status</option>' + Object.keys(PN_ST).map(function (k) { return '<option>' + PN_ST[k] + '</option>'; }).join('') + '</select>' +
        '<span class="pn-who" id="pnWho">' + pnEsc(pnMe.cargo) + ' <b>' + pnEsc(pnMe.nick) + '</b></span></div>' +
        '<div id="pnLista"><div class="pn-msg">Carregando...</div></div>';
    document.getElementById('pnQ').addEventListener('input', pnDesenhar);
    document.getElementById('pnF').addEventListener('change', pnDesenhar);
    var lista = document.getElementById('pnLista');
    lista.addEventListener('input', function (e) { if (e.target.classList.contains('pn-mot')) pnDrafts[e.target.dataset.id] = e.target.value; });
    lista.addEventListener('toggle', function (e) { var c = e.target.closest('.pn-card'); if (c && e.target.tagName === 'DETAILS') pnAbertos[c.dataset.id] = e.target.open; }, true);
    lista.addEventListener('click', pnClique);
    pnRef = firebaseDb.ref('requerimentos').orderByChild('dataEnvio').limitToLast(150);
    pnRef.on('value', function (snap) { pnData = snap.val() || {}; pnDesenhar(); },
        function (err) { lista.innerHTML = '<div class="pn-msg">Erro: ' + pnEsc(err.message) + '</div>'; });
}
 
function pnCard(id, r) {
    var est = pnEstado(r.status), dis = pnBusy[id] ? ' disabled' : '';
    var linhas = '<div class="k">Solicitante</div><div class="v">' + pnEsc(r.autor || '—') + '</div>' +
        '<div class="k">Enviado em</div><div class="v">' + pnEsc(r.dataFormatada || pnDataHora(r.dataEnvio)) + '</div>' +
        '<div class="k">Tipo</div><div class="v">' + pnEsc(r.titulo || r.tipo || '—') + '</div>' +
        '<div class="pn-sep">Dados do requerimento</div>';
    var campos = r.campos || {};
    Object.keys(campos).forEach(function (k) {
        var t = pnFmt(campos[k]);
        if (t !== '') linhas += '<div class="k">' + pnEsc(pnLabel(k)) + '</div><div class="v">' + pnEsc(t) + '</div>';
    });
    var posts = r.postagens ? Object.keys(r.postagens).map(function (k) { return r.postagens[k]; }) : [];
    if (posts.length) {
        linhas += '<div class="pn-sep">Postagens no fórum</div>' + posts.map(function (p) {
            return '<div class="k">Tópico ' + pnEsc(p.threadId) + '</div><div class="v">' + (p.sucesso ? 'Postado' : 'Falhou: ' + pnEsc(p.erro || '')) + '</div>';
        }).join('');
    }
    var acts = '';
    if (est === PN_ST.PEN) {
        acts = '<input class="pn-mot" data-id="' + pnEsc(id) + '" maxlength="300" placeholder="Motivo (obrigatório para reprovar)" value="' + pnEsc(pnDrafts[id] || '') + '" />' +
            '<button data-a="apr" style="background:var(--ok)"' + dis + '>Aprovar</button>' +
            '<button data-a="rec" style="background:var(--err)"' + dis + '>Reprovar</button>';
    } else if (est === PN_ST.APR || est === PN_ST.REC) {
        acts = '<input class="pn-mot" data-id="' + pnEsc(id) + '" maxlength="300" placeholder="Motivo do cancelamento (obrigatório)" value="' + pnEsc(pnDrafts[id] || '') + '" />' +
            '<button data-a="can" style="background:var(--gld-dk)"' + dis + '>Cancelar</button>';
    } else {
        acts = '<span class="pn-final">Requerimento cancelado — finalizado, sem novas alterações.</span>';
    }
    var hist = (r.historico ? Object.keys(r.historico).map(function (k) { return r.historico[k]; }) : []).map(function (h) {
        return pnEsc(h.acao) + ' por <b>' + pnEsc(h.por) + '</b> (' + pnEsc(h.cargo || '') + ') em ' + pnDataHora(h.em) + (h.motivo ? ' — Motivo: ' + pnEsc(h.motivo) : '');
    }).join('<br>');
    return '<div class="pn-card" data-id="' + pnEsc(id) + '">' +
        '<div class="pn-top"><span class="pn-id">' + pnEsc(id) + '</span><span class="pn-tt">' + pnEsc(r.titulo) + '</span><span class="pn-pill s-' + pnCls(est) + '">' + pnEsc(est) + '</span></div>' +
        '<div class="pn-grid">' + linhas + '</div>' +
        '<details' + (pnAbertos[id] ? ' open' : '') + '><summary>Ver BBCode postado</summary><pre>' + pnEsc(r.bbcode) + '</pre></details>' +
        '<div class="pn-acts">' + acts + '</div>' +
        (hist ? '<div class="pn-last">' + hist + '</div>' : '') + '</div>';
}
 
function pnDesenhar() {
    var qEl = document.getElementById('pnQ'); if (!qEl) return;
    var q = pnNorm(qEl.value), f = document.getElementById('pnF').value;
    var ids = Object.keys(pnData).sort(function (a, b) { return (pnData[b].dataEnvio || 0) - (pnData[a].dataEnvio || 0); });
    var html = ids.filter(function (id) {
        var r = pnData[id];
        if (f && pnEstado(r.status) !== f) return false;
        return !q || pnNorm(id + ' ' + r.titulo + ' ' + r.autor + ' ' + (r.nicknames || []).join(' ')).indexOf(q) !== -1;
    }).map(function (id) { return pnCard(id, pnData[id]); }).join('');
    document.getElementById('pnLista').innerHTML = html || '<div class="pn-msg">Nenhum requerimento encontrado.</div>';
}
 
function pnClique(e) {
    var b = e.target.closest('.pn-acts button[data-a]');
    if (!b || !pnMe) return;
    var card = b.closest('.pn-card'), id = card.dataset.id, a = b.dataset.a, mot = (pnDrafts[id] || '').trim();
    if (a === 'apr') return pnDecidir(id, PN_ST.APR, '');
    if (!mot) {
        var inp = card.querySelector('.pn-mot');
        if (inp) { inp.classList.add('campo-erro'); inp.focus(); setTimeout(function () { inp.classList.remove('campo-erro'); }, 3000); }
        return showToast('Motivo obrigatório', 'Informe o motivo para ' + (a === 'rec' ? 'reprovar' : 'cancelar') + '.', 'err');
    }
    if (a === 'rec') return pnDecidir(id, PN_ST.REC, mot);
    if (a === 'can' && confirm('Cancelar este requerimento? Depois disso nada mais poderá ser alterado.')) pnDecidir(id, PN_ST.CAN, mot);
}
 
/* Transação atômica: só grava se o estado atual permitir a transição */
function pnDecidir(id, acao, motivo) {
    if (pnBusy[id]) return;
    pnBusy[id] = true; pnDesenhar();
    var bloqueado = false;
    firebaseDb.ref('requerimentos/' + id).transaction(function (cur) {
        if (cur === null) return cur;
        var est = pnEstado(cur.status);
        if (acao === PN_ST.CAN) {
            if (est !== PN_ST.APR && est !== PN_ST.REC) { bloqueado = true; return; }
        } else if (est !== PN_ST.PEN) { bloqueado = true; return; }
        if ((acao === PN_ST.REC || acao === PN_ST.CAN) && !motivo) { bloqueado = true; return; }

        cur.status = acao;
        cur.avaliador = pnMe.nick;
        cur.cargoAvaliador = pnMe.cargo;
        cur.dataAtualizacao = Date.now();
        if (acao === PN_ST.REC) { cur.motivo = motivo; cur.obs = motivo; delete cur.motivoCancelamento; }
        else if (acao === PN_ST.CAN) { cur.motivoCancelamento = motivo; cur.obs = motivo; }   /* o motivo da reprovação fica preservado em cur.motivo */
        else { delete cur.motivo; delete cur.obs; delete cur.motivoCancelamento; }

        var h = cur.historico || [];
        h.push({ acao: acao, por: pnMe.nick, cargo: pnMe.cargo, em: Date.now(), motivo: (acao === PN_ST.APR) ? null : motivo });
        cur.historico = h;
        return cur;
    }, function (err, ok) {
        pnBusy[id] = false;
        if (err || !ok || bloqueado) showToast('Não alterado', 'Este requerimento já foi decidido ou finalizado.', 'err');
        else { delete pnDrafts[id]; showToast(acao, id + ' atualizado.', 'ok'); }
        pnDesenhar();
    }, false);
}
 
document.addEventListener('DOMContentLoaded', iniciarPainel);

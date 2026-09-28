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

function esconderLoader() {
    const loader = document.getElementById('loader');
    if (!loader || loader.dataset.done) return;
    loader.dataset.done = '1';
    loader.classList.add('fade-out');
    setTimeout(function() { loader.style.display = 'none'; }, 500);
}
window.addEventListener('load', function() { setTimeout(esconderLoader, 500); });
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
            return match[1];
        } else { isUserLoggedIn = false; return null; }
    } catch(err) { isUserLoggedIn = false; return null; }
}

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

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function gerarIdRequerimento() {
    if (!firebaseDb) return null;
    const contadorRef = firebaseDb.ref("contador_requerimentos");
    return new Promise((resolve, reject) => {
        contadorRef.transaction(function(current) { return (current || 0) + 1; }, function(error, committed, snapshot) {
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
                    formattedValue.split(" / ").forEach(line => placeholdersData += '[font=Poppins][b][color=#000000]'+line+'[/color][/b][/font]\n');
                } else placeholdersData += "[b]"+placeholder+"[/b]: "+formattedValue+"\n";
            }
        }
    });
    inner += placeholdersData;
    if (formId === "form1" || formId === "form2" || formId === "form6" || formId === "form11") {
        const today = new Date();
        inner += "[b]Data:[/b] " + String(today.getDate()).padStart(2,"0") + "/" + String(today.getMonth()+1).padStart(2,"0") + "/" + today.getFullYear() + "\n";
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
    nomes.forEach(function(nickBruto) {
        const nick = nickBruto.trim();
        const mensagemFinal = mpTemplates[cargoSelecionado]?.replaceAll('{USERNAME}', nick);
        if (mensagemFinal) {
            $.post("/privmsg", { folder: "inbox", mode: "post", username: nick, subject: `[INS] Promocao a ${cargoSelecionado}`, message: mensagemFinal, post: 1 });
        }
    });
}

/* === Handler de submit: Firebase primeiro, depois fórum === */
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
                document.querySelectorAll('#'+formId+' .subgrupo.selected').forEach(sg => {
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
                await firebaseDb.ref("requerimentos/" + idReq + "/postagens").set(updates).catch(()=>{});
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
    st.textContent = `
.st-Pendente{--c:#f59e0b}.st-Aprovado{--c:#10b981}.st-Recusado{--c:#e5484d}.st-Cancelado{--c:#6b7280}

.pc.pn-card{padding:0;overflow:hidden;border-radius:12px;background:#12295a;border:1px solid rgba(160,198,245,.16);border-top:3px solid var(--c);box-shadow:0 8px 22px rgba(0,0,0,.3);margin-bottom:16px;transition:transform .16s ease,box-shadow .16s ease}
.pc.pn-card:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(0,0,0,.38)}
.pc-head{position:relative;min-height:122px;padding:14px 16px 14px 116px;color:#fff;
 background:linear-gradient(180deg,rgba(255,255,255,.1),transparent 45%),linear-gradient(135deg,#2b74e0,#1751b0)}
.pc-avatar{position:absolute;left:6px;bottom:0;width:96px;height:122px;overflow:hidden;pointer-events:none}
.pc-avatar img{position:absolute;top:0;left:50%;transform:translateX(-50%);width:184px;height:auto;image-rendering:pixelated}
.pc-top{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;padding:7px 8px 7px 12px;border-radius:10px;background:rgba(0,0,0,.27);border:1px solid rgba(255,255,255,.12)}
.pc-id{flex:0 0 auto;font-size:15px;font-weight:800}
.pc-type{min-width:0;font-size:13px;font-weight:600;opacity:.92;overflow-wrap:anywhere}
.pc-chip{flex:0 0 auto;margin-left:auto;padding:4px 12px;border-radius:999px;background:var(--c);color:#fff;font-size:11.5px;font-weight:800;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
.pc-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.pc-pill{display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:3px 10px;border-radius:8px;background:rgba(0,0,0,.27);font-size:12px;font-weight:600}
.pc-pill i{font-size:11px;opacity:.75}
.pc-body{padding:14px 16px 16px;background:linear-gradient(180deg,#12295a,#0f234e);color:#f3f7fd}
.pc-sec{margin-top:16px}.pc-sec:first-child{margin-top:0}
.pc-sec h4{margin-bottom:8px;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#93b0dc}
.pc-row{display:grid;grid-template-columns:minmax(120px,170px) 1fr;gap:12px;padding:9px 12px;margin-bottom:6px;border-radius:10px;background:rgba(255,255,255,.055);border:1px solid rgba(160,198,245,.08);font-size:13px;line-height:1.45}
.pc-row .k{color:#b7cdea;font-size:12px}
.pc-row .v{color:#f3f7fd;font-weight:600;word-break:break-word}
@media(max-width:560px){.pc-row{grid-template-columns:1fr;gap:2px}.pc-head{padding-left:104px}}
.pc-ev{display:flex;gap:12px;align-items:flex-start;padding:11px 12px;margin-bottom:8px;border-radius:12px;background:linear-gradient(135deg,rgba(43,116,224,.28),rgba(23,81,176,.2));border:1px solid rgba(160,198,245,.1);border-left:4px solid var(--c)}
.pc-ev-av{flex:0 0 40px;width:40px;height:40px;border-radius:10px;overflow:hidden;background:rgba(0,0,0,.2);display:flex;align-items:flex-end;justify-content:center}
.pc-ev-av img{width:80px;height:auto;margin-bottom:-13px;image-rendering:pixelated}
.pc-ev-main{flex:1;min-width:0;font-size:13px;line-height:1.5}
.pc-ev-act{display:inline-block;padding:2px 10px;margin-right:6px;border-radius:999px;background:var(--c);color:#fff;font-size:11px;font-weight:800}
.pc-ev-main small{color:#b7cdea}
.pc-ev-date{display:block;color:#93b0dc;font-size:11.5px;font-variant-numeric:tabular-nums}
.pc-ev-mot{margin-top:7px;padding:8px 10px;border-radius:8px;background:rgba(8,29,66,.62);border:1px solid rgba(160,198,245,.12);color:#b7cdea;font-size:12.5px;word-break:break-word}
.pc-ev-mot b{color:#f3f7fd}
.pc .pn-acts{margin-top:16px;padding-top:14px;border-top:1px solid rgba(160,198,245,.16)}
.pc details{font-size:12px;color:#b7cdea}
.pc details summary{cursor:pointer;color:#9dd0ff;font-weight:700}
.pc details pre{background:rgba(8,29,66,.72);border:1px solid rgba(160,198,245,.12);color:#f3f7fd;border-radius:8px;padding:10px;white-space:pre-wrap;word-break:break-word;max-height:180px;overflow:auto}
.pc .pn-acts input{background:rgba(255,255,255,.055);border-color:rgba(160,198,245,.18);color:#f3f7fd}
.pc .pn-acts input::placeholder{color:#93b0dc}
.pc .pn-acts button{height:40px;padding:0 18px;border-radius:12px;box-shadow:var(--sh-xs)}
.pn-final{font-size:12px;color:#b7cdea;font-style:italic}
`;
    document.head.appendChild(st);
})();

function pnEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pnNorm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function pnCls(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-'); }
function pnEstado(s) { return (s === PN_ST.APR || s === PN_ST.REC || s === PN_ST.CAN) ? s : PN_ST.PEN; } /* "Em análise" antigo = Pendente */
function pnLabel(k) { return PN_LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); }
function pnDataHora(t) { return t ? new Date(t).toLocaleString('pt-BR') : '—'; }

function pnAvatar(nick, full) {
    var u = encodeURIComponent(nick || '');
    return full
        ? 'https://www.habbo.com.br/habbo-imaging/avatarimage?user=' + u + '&action=std,crr=1&direction=2&head_direction=3&img_format=png&gesture=sml&headonly=0&size=l'
        : 'https://www.habbo.com.br/habbo-imaging/avatarimage?img_format=png&user=' + u + '&direction=2&head_direction=2&size=m&headonly=1&gesture=sml';
}

function pnEventos(r) {
    var ev = r.historico ? Object.keys(r.historico).sort().map(function (k) { return r.historico[k]; }) : [];
    if (!ev.length && r.avaliador && (r.status === PN_ST.APR || r.status === PN_ST.REC || r.status === PN_ST.CAN)) {
        ev = [{ acao: r.status, por: r.avaliador, cargo: r.cargoAvaliador, em: r.dataAtualizacao, motivo: r.obs || null }];
    }
    return ev;
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
        else pnDesenhar();
    });
}

function pnMontar() {
    pnMontado = true;
    document.getElementById('painelRoot').innerHTML =
        '<div id="pnLista"><div class="pn-msg">Carregando...</div></div>';
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

    var pills = '<span class="pc-pill"><i class="fa-solid fa-user"></i>' + pnEsc(r.autor || '—') + '</span>' +
        '<span class="pc-pill"><i class="fa-solid fa-calendar-days"></i>' + pnEsc(r.dataFormatada || pnDataHora(r.dataEnvio)) + '</span>' +
        ((r.nicknames || []).length ? '<span class="pc-pill"><i class="fa-solid fa-id-badge"></i>' + pnEsc(r.nicknames.join(', ')) + '</span>' : '');

    var campos = r.campos || {}, rows = '';
    Object.keys(campos).forEach(function (k) {
        var t = pnFmt(campos[k]);
        if (t !== '') rows += '<div class="pc-row"><span class="k">' + pnEsc(pnLabel(k)) + '</span><span class="v">' + pnEsc(t) + '</span></div>';
    });

    var posts = r.postagens ? Object.keys(r.postagens).map(function (k) { return r.postagens[k]; }) : [];
    var postsHtml = posts.map(function (p) {
        return '<div class="pc-row"><span class="k">Tópico ' + pnEsc(p.threadId) + '</span><span class="v">' + (p.sucesso ? 'Postado' : 'Falhou: ' + pnEsc(p.erro || '')) + '</span></div>';
    }).join('');

    var evs = pnEventos(r).map(function (h) {
        return '<div class="pc-ev st-' + pnCls(h.acao) + '"><span class="pc-ev-av"><img loading="lazy" src="' + pnAvatar(h.por, false) + '" alt=""></span>' +
            '<div class="pc-ev-main"><span class="pc-ev-act">' + pnEsc(h.acao) + '</span>por <b>' + pnEsc(h.por) + '</b> <small>(' + pnEsc(h.cargo || '—') + ')</small>' +
            '<span class="pc-ev-date">' + pnDataHora(h.em) + '</span>' +
            (h.motivo ? '<div class="pc-ev-mot"><b>Motivo:</b> ' + pnEsc(h.motivo) + '</div>' : '') + '</div></div>';
    }).join('');

    var acts;
    if (est === PN_ST.PEN) {
        acts = '<input class="pn-mot" data-id="' + pnEsc(id) + '" maxlength="300" placeholder="Motivo (obrigatório para reprovar)" value="' + pnEsc(pnDrafts[id] || '') + '" />' +
            '<button data-a="apr" style="background:var(--ok)"' + dis + '>Aprovar</button>' +
            '<button data-a="rec" style="background:var(--err)"' + dis + '>Reprovar</button>';
    } else if (est === PN_ST.APR || est === PN_ST.REC) {
        acts = '<input class="pn-mot" data-id="' + pnEsc(id) + '" maxlength="300" placeholder="Motivo do cancelamento (obrigatório)" value="' + pnEsc(pnDrafts[id] || '') + '" />' +
            '<button data-a="can" style="background:var(--gld-dk)"' + dis + '>Cancelar ' + (est === PN_ST.APR ? 'aprovação' : 'reprovação') + '</button>';
    } else {
        acts = '<span class="pn-final">Requerimento cancelado — finalizado, sem novas alterações.</span>';
    }

    return '<article class="pc pn-card st-' + pnCls(est) + '" data-id="' + pnEsc(id) + '">' +
        '<div class="pc-head"><div class="pc-avatar"><img src="' + pnAvatar(r.autor, true) + '" alt=""></div>' +
        '<div class="pc-top"><span class="pc-id">' + pnEsc(id) + '</span><span class="pc-type">' + pnEsc(r.titulo) + '</span>' +
        '<span class="pc-chip st-' + pnCls(est) + '">' + pnEsc(est) + '</span></div><div class="pc-pills">' + pills + '</div></div>' +
        '<div class="pc-body">' +
        '<div class="pc-sec"><h4>Dados do requerimento</h4>' + (rows || '<div class="pc-row"><span class="k">—</span><span class="v">Sem dados estruturados</span></div>') + '</div>' +
        (postsHtml ? '<div class="pc-sec"><h4>Postagens no fórum</h4>' + postsHtml + '</div>' : '') +
        (evs ? '<div class="pc-sec"><h4>Histórico de decisões</h4>' + evs + '</div>' : '') +
        '<details' + (pnAbertos[id] ? ' open' : '') + '><summary>Ver BBCode postado</summary><pre>' + pnEsc(r.bbcode) + '</pre></details>' +
        '<div class="pn-acts">' + acts + '</div></div></article>';
}

function pnDesenhar() {
    if (!document.getElementById('pnLista')) return;
    var ids = Object.keys(pnData).sort(function (a, b) { return (pnData[b].dataEnvio || 0) - (pnData[a].dataEnvio || 0); });
    var html = ids.map(function (id) { return pnCard(id, pnData[id]); }).join('');
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
    if (a === 'can' && confirm('Cancelar a decisão e o requerimento? Depois disso nada mais poderá ser alterado.')) pnDecidir(id, PN_ST.CAN, mot);
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
        pnBusy[id] = false; delete pnDrafts[id];
        showToast(acao, id + ' atualizado.', 'ok'); pnDesenhar();
    }).catch(function (err) {
        pnBusy[id] = false;
        showToast('Não alterado', 'Outro gestor já alterou ou sem permissão (' + (err.code || err.message) + ').', 'err'); pnDesenhar();
    });
}

document.addEventListener('DOMContentLoaded', iniciarPainel);

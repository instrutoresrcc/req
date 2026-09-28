/* =====================================================================
   BLOCO 1 — SUBSTITUA a função extrairDadosEstruturados inteira.
   Agora salva TODA a informação do formulário no Firebase (campos).
   ===================================================================== */
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

/* =====================================================================
   BLOCO 2 — SUBSTITUA a função gerarIframeStatus inteira.
   Agora entende "Cancelado" e mostra o motivo (obs) e quem decidiu.
   ===================================================================== */
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

/* =====================================================================
   BLOCO 3 — APAGUE tudo do comentário "PAINEL DE GESTÃO" até o final
   do arquivo e cole ESTE bloco no lugar.
   Fluxo: Pendente → Aprovado | Recusado (motivo obrigatório)
          → Cancelar (só depois de decidido) → Cancelado (final, travado)
   ===================================================================== */
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
        acts = '<button data-a="can" style="background:var(--gld-dk)"' + dis + '>Cancelar</button>';
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
    var id = b.closest('.pn-card').dataset.id, a = b.dataset.a, mot = (pnDrafts[id] || '').trim();
    if (a === 'apr') return pnDecidir(id, PN_ST.APR, '');
    if (a === 'rec') {
        if (!mot) {
            var inp = b.closest('.pn-card').querySelector('.pn-mot');
            if (inp) { inp.classList.add('campo-erro'); inp.focus(); setTimeout(function () { inp.classList.remove('campo-erro'); }, 3000); }
            return showToast('Motivo obrigatório', 'Informe o motivo para reprovar.', 'err');
        }
        return pnDecidir(id, PN_ST.REC, mot);
    }
    if (a === 'can' && confirm('Cancelar este requerimento? Depois disso nada mais poderá ser alterado.')) pnDecidir(id, PN_ST.CAN, '');
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
        } else {
            if (est !== PN_ST.PEN) { bloqueado = true; return; }
            if (acao === PN_ST.REC && !motivo) { bloqueado = true; return; }
        }
        cur.status = acao;
        cur.avaliador = pnMe.nick;
        cur.cargoAvaliador = pnMe.cargo;
        cur.dataAtualizacao = Date.now();
        if (acao === PN_ST.REC) { cur.motivo = motivo; cur.obs = motivo; }
        else { delete cur.motivo; delete cur.obs; }
        var h = cur.historico || [];
        h.push({ acao: acao, por: pnMe.nick, cargo: pnMe.cargo, em: Date.now(), motivo: acao === PN_ST.REC ? motivo : null });
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

// Testes da lógica da calculadora O-RADS (dados sintéticos). Rodar: node tests/test_orads.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'calculadoras', 'orads.html'), 'utf8');
const src = html.match(/<script id="orads-logic">([\s\S]*?)<\/script>/)[1];
const mod = { exports: {} };
new Function('module', src)(mod);
const { classificarUS, classificarRM, fraseLaudo } = mod.exports;

const US = (o) => classificarUS(Object.assign({ us_tec: 'sim', us_tipo: 'outra', us_meno: 'pre' }, o)).cat;
const RM = (o) => classificarRM(Object.assign({ rm_tec: 'sim', rm_perit: 'nao' }, o)).cat;
const cist = (o) => Object.assign({ us_comp: 'cistica', us_cint: 'liso' }, o);
let n = 0;
const eq = (obtido, esperado, nome) => { assert.strictEqual(obtido, esperado, nome); n++; };

// --- US: categorias 0 e 1
eq(classificarUS({ us_tec: 'nao' }).cat, 0, 'US tecnicamente inadequado');
eq(US({ us_tipo: 'normal' }), 1, 'ovário normal');
eq(US({ us_tipo: 'fisio', us_fisio: 'luteo' }), 1, 'corpo lúteo');
eq(US({ us_tipo: 'nao_visto', us_naovisto: 'exigido' }), 0, 'ovário não visto, exigido');
eq(US({ us_tipo: 'nao_visto', us_naovisto: 'ausente' }), null, 'ovário ausente: não aplicável');
eq(US({ us_tipo: 'extra', us_extra: 'hidro' }), 2, 'hidrossalpinge');

// --- US: cistos sem componente sólido
eq(US(cist({ us_loc: 'uni', us_ecos: 'nenhum', us_tam: 2.5 })), 1, 'simples ≤3 pré = folículo');
eq(US(cist({ us_loc: 'uni', us_ecos: 'nenhum', us_tam: 2.5, us_meno: 'pos' })), 2, 'simples ≤3 pós');
eq(US(cist({ us_loc: 'uni', us_ecos: 'nenhum', us_tam: 9.9 })), 2, 'simples <10');
eq(US(cist({ us_loc: 'uni', us_ecos: 'nenhum', us_tam: 10 })), 3, 'simples ≥10');
eq(US(cist({ us_loc: 'uni', us_ecos: 'ecos', us_tam: 4 })), 2, 'unilocular não simples <10');
eq(US(cist({ us_loc: 'uni', us_ecos: 'ambos', us_tam: 12 })), 3, 'unilocular não simples ≥10');
eq(US(cist({ us_loc: 'uni', us_cint: 'irregular', us_tam: 2 })), 3, 'unilocular irregular');
eq(US(cist({ us_loc: 'bi', us_tam: 6 })), 2, 'bilocular liso <10');
eq(US(cist({ us_loc: 'bi', us_tam: 11 })), 3, 'bilocular liso ≥10');
eq(US(cist({ us_loc: 'bi', us_cint: 'irregular', us_tam: 3 })), 4, 'bilocular irregular');
eq(US(cist({ us_loc: 'multi', us_tam: 6, us_cs: '3' })), 3, 'multilocular liso <10 CS<4');
eq(US(cist({ us_loc: 'multi', us_tam: 10, us_cs: '1' })), 4, 'multilocular liso ≥10');
eq(US(cist({ us_loc: 'multi', us_tam: 4, us_cs: '4' })), 4, 'multilocular liso CS4');
eq(US(cist({ us_loc: 'multi', us_cint: 'irregular', us_tam: 4 })), 4, 'multilocular irregular');

// --- US: cistos com componente sólido
const cs = (o) => Object.assign({ us_comp: 'cist_solida', us_tam: 5 }, o);
eq(US(cs({ us_loc: 'uni', us_pp: '1a3' })), 4, 'unilocular 1-3 pp');
eq(US(cs({ us_loc: 'uni', us_pp: 'nao_pp' })), 4, 'unilocular sólido não papilar');
eq(US(cs({ us_loc: 'uni', us_pp: '4mais' })), 5, 'unilocular ≥4 pp');
eq(US(cs({ us_loc: 'bi', us_cs: '2' })), 4, 'bilocular sólido CS2');
eq(US(cs({ us_loc: 'multi', us_cs: '3' })), 5, 'multilocular sólido CS3');

// --- US: lesões sólidas
const sol = (o) => Object.assign({ us_comp: 'solida', us_tam: 5, us_cext: 'liso', us_sombra: 'nao' }, o);
eq(US(sol({ us_cs: '1' })), 3, 'sólida lisa CS1');
eq(US(sol({ us_cs: '3', us_sombra: 'sim' })), 3, 'sólida lisa com sombra CS3');
eq(US(sol({ us_cs: '2' })), 4, 'sólida lisa sem sombra CS2');
eq(US(sol({ us_cs: '4', us_sombra: 'sim' })), 5, 'sólida lisa CS4');
eq(US(sol({ us_cext: 'irregular' })), 5, 'sólida irregular');

// --- US: lesões benignas clássicas
const cl = (o) => Object.assign({ us_tipo: 'classico' }, o);
eq(US(cl({ us_classico: 'dermoide', us_tam: 6 })), 2, 'dermoide <10');
eq(US(cl({ us_classico: 'endometrioma', us_tam: 10 })), 3, 'endometrioma ≥10');
eq(US(cl({ us_classico: 'hemorragico', us_tam: 4 })), 2, 'hemorrágico pré');
eq(US(cl({ us_classico: 'hemorragico', us_tam: 4, us_meno: 'pos', us_posmeno: 'tardia' })), null, 'hemorrágico pós tardia: recategorizar');

// --- US: ascite / nódulos peritoneais
const asc = { us_ascite: 'sim', us_nodulos: 'nao', us_etiologia: 'nao' };
eq(US(Object.assign(cist({ us_loc: 'multi', us_tam: 6, us_cs: '2' }), asc)), 5, 'O-RADS 3 + ascite sem etiologia = 5');
eq(US(Object.assign(cist({ us_loc: 'bi', us_tam: 6 }), asc)), 2, 'O-RADS 2 + ascite não eleva');
eq(US(Object.assign(cs({ us_loc: 'uni', us_pp: '1a3' }), asc, { us_etiologia: 'sim' })), 4, 'ascite explicada não eleva');

// --- RM
eq(classificarRM({ rm_tec: 'nao' }).cat, 0, 'RM inadequada');
eq(classificarRM({ rm_tec: 'sim', rm_perit: 'sim' }).cat, 5, 'nodularidade peritoneal');
eq(RM({ rm_achado: 'normal' }), 1, 'RM normal');
eq(RM({ rm_achado: 'fisio', rm_fisio: 'luteo' }), 1, 'RM corpo lúteo');
eq(RM({ rm_achado: 'para' }), 2, 'paraovariano');
eq(RM({ rm_achado: 'tuba', rm_tuba_cont: 'simples', rm_tuba_parede: 'fina' }), 2, 'tuba simples fina');
eq(RM({ rm_achado: 'tuba', rm_tuba_cont: 'simples', rm_tuba_parede: 'espessa' }), 3, 'tuba simples espessa');
eq(RM({ rm_achado: 'tuba', rm_tuba_cont: 'nao_simples', rm_tuba_parede: 'fina' }), 3, 'tuba não simples fina');
const ci = (o) => Object.assign({ rm_achado: 'cisto', rm_lipid: 'nao' }, o);
eq(RM(ci({ rm_estrutura: 'uni_sem', rm_conteudo: 'proteico' })), 2, 'unilocular sem realce, qualquer líquido');
eq(RM(ci({ rm_estrutura: 'uni_com', rm_conteudo: 'simples', rm_pequeno: 'nao' })), 2, 'unilocular realce, simples');
eq(RM(ci({ rm_estrutura: 'uni_com', rm_conteudo: 'endometriotico' })), 2, 'unilocular realce, endometriótico');
eq(RM(ci({ rm_estrutura: 'uni_com', rm_conteudo: 'hemorragico', rm_pequeno: 'nao' })), 3, 'unilocular realce, hemorrágico');
eq(RM(ci({ rm_estrutura: 'uni_com', rm_conteudo: 'proteico' })), 3, 'unilocular realce, proteináceo');
eq(RM(ci({ rm_estrutura: 'uni_com', rm_conteudo: 'hemorragico', rm_pequeno: 'sim' })), 1, 'hemorrágico ≤3 pré');
eq(RM(ci({ rm_estrutura: 'multi' })), 3, 'multilocular');
eq(RM({ rm_achado: 'cisto', rm_lipid: 'sim', rm_lipid_solido: 'nao' }), 2, 'lipídio sem sólido');
eq(RM({ rm_achado: 'solida', rm_lipid: 'sim', rm_lipid_solido: 'sim' }), 4, 'lipídio com grande volume sólido');
const so = (o) => Object.assign({ rm_achado: 'cist_solida', rm_lipid: 'nao', rm_dark: 'nao', rm_mio: 'sim' }, o);
eq(RM(so({ rm_dark: 'sim' })), 2, 'dark T2/dark DWI');
eq(RM(so({ rm_tic: 'baixo' })), 3, 'TIC baixo');
eq(RM(so({ rm_tic: 'intermediario' })), 4, 'TIC intermediário');
eq(RM(so({ rm_tic: 'alto' })), 5, 'TIC alto');
eq(RM(so({ rm_tic: 'indisponivel', rm_naodce: 'menor' })), 4, 'sem DCE, ≤ miométrio');
eq(RM(so({ rm_tic: 'indisponivel', rm_naodce: 'maior' })), 5, 'sem DCE, > miométrio');
eq(RM(so({ rm_tic: 'alto', rm_mio: 'nao' })), '4-5', 'sem miométrio de referência');

// --- Frase do laudo sempre cita o ACR
const a = Object.assign({ us_tec: 'sim', us_tipo: 'outra', us_meno: 'pre', us_lado: 'dir' }, cist({ us_loc: 'multi', us_tam: 6.5, us_cs: '2' }));
const frase = fraseLaudo(classificarUS(a), a);
assert.ok(/O-RADS US 3/.test(frase) && /6,5 cm/.test(frase) && /American College of Radiology/.test(frase), frase); n++;
const b = { rm_tec: 'sim', rm_perit: 'nao', rm_achado: 'para' };
assert.ok(/American College of Radiology/.test(fraseLaudo(classificarRM(b), b))); n++;

console.log(n + ' testes OK');

// Frase do laudo: em cada linha, ponto só no final (vírgulas no meio)
{
  const casos = [
    Object.assign({ us_tec: 'sim', us_tipo: 'classico', us_classico: 'hemorragico', us_meno: 'pos', us_posmeno: 'precoce', us_tam: 4.5, us_ascite: 'sim', us_nodulos: 'nao', us_etiologia: 'sim' }),
    Object.assign({ us_tec: 'sim', us_tipo: 'outra', us_meno: 'pre', us_comp: 'solida', us_cext: 'liso', us_sombra: 'sim', us_cs: '2', us_tam: 3.2, us_ascite: 'nao', us_nodulos: 'nao' }),
  ];
  for (const c of casos) {
    const t = fraseLaudo(classificarUS(c), c);
    for (const l of t.split('\n')) assert.ok(!/\.\s/.test(l) && /[^.]\.$/.test(l), l);
    assert.ok(/\d,\d cm/.test(t), t);
  }
  console.log('frase com ponto só no final: OK');
}

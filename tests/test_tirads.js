// Testes da lógica da calculadora ACR TI-RADS (dados sintéticos). Rodar: node tests/test_tirads.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'calculadoras', 'tirads.html'), 'utf8');
const src = html.match(/<script id="tirads-logic">([\s\S]*?)<\/script>/)[1];
const mod = { exports: {} };
new Function('module', src)(mod);
const { classificar, fraseLaudo } = mod.exports;

let n = 0;
const base = { comp: 'solido', eco: 'hiper_iso', forma: 'largo', margem: 'lisa', focos: ['nenhum'], tam: 2 };
const C = (o) => classificar(Object.assign({}, base, o));
const eq = (obtido, esperado, nome) => { assert.strictEqual(obtido, esperado, nome); n++; };

// Pontuação e categoria
eq(C({ comp: 'cistico', eco: 'anecoico' }).tr, 1, 'cístico anecoico = 0 pontos = TR1');
eq(C({ comp: 'espongiforme', eco: 'muito_hipo', focos: ['puntiforme'] }).pontos, 0, 'espongiforme não soma pontos');
eq(C({ comp: 'misto', eco: 'anecoico' }).tr, 1, '1 ponto = TR1 (convenção)');
eq(C({ comp: 'misto' }).tr, 2, '2 pontos = TR2');
eq(C({}).pontos, 3, 'sólido isoecoico = 3 pontos');
eq(C({}).tr, 3, '3 pontos = TR3');
eq(C({ eco: 'hipo' }).tr, 4, '4 pontos = TR4');
eq(C({ eco: 'hipo', margem: 'lobulada' }).tr, 4, '6 pontos = TR4');
eq(C({ eco: 'hipo', forma: 'alto' }).tr, 5, '7 pontos = TR5');
eq(C({ eco: 'muito_hipo', forma: 'alto', margem: 'extensao', focos: ['macro', 'periferica', 'puntiforme'] }).pontos, 17, 'pontuação máxima');
eq(C({ focos: ['macro', 'puntiforme'] }).pontos, 7, 'focos ecogênicos se somam');
eq(C({ comp: 'indet', eco: 'indet', margem: 'indet' }).pontos, 3, 'não determináveis: 2 + 1 + 0');

// Conduta por tamanho
const cond = (o) => C(o).conduta;
assert.ok(/Sem indicação de PAAF e sem/.test(cond({ comp: 'misto', tam: 5 }))); n++;                    // TR2
assert.ok(/^PAAF indicada/.test(cond({ tam: 2.5 }))); n++;                                              // TR3 ≥2,5
assert.ok(/Seguimento.*1, 3 e 5 anos/.test(cond({ tam: 1.5 }))); n++;                                   // TR3 ≥1,5
assert.ok(/Sem indicação de PAAF ou de seguimento/.test(cond({ tam: 1.4 }))); n++;                      // TR3 <1,5
assert.ok(/^PAAF indicada/.test(cond({ eco: 'hipo', tam: 1.5 }))); n++;                                 // TR4 ≥1,5
assert.ok(/Seguimento.*1, 2, 3 e 5 anos/.test(cond({ eco: 'hipo', tam: 1.0 }))); n++;                   // TR4 ≥1,0
assert.ok(/Sem indicação/.test(cond({ eco: 'hipo', tam: 0.9 }))); n++;                                  // TR4 <1,0
assert.ok(/^PAAF indicada/.test(cond({ eco: 'hipo', forma: 'alto', tam: 1.0 }))); n++;                  // TR5 ≥1,0
assert.ok(/Seguimento.*anual/.test(cond({ eco: 'hipo', forma: 'alto', tam: 0.5 }))); n++;               // TR5 ≥0,5
assert.ok(/Sem indicação/.test(cond({ eco: 'hipo', forma: 'alto', tam: 0.4 }))); n++;                   // TR5 <0,5

// Frase do laudo cita o ACR
const a = Object.assign({}, base, { eco: 'hipo', focos: ['puntiforme'], tam: 1.8, local: 'ld' });
const f = fraseLaudo(classificar(a), a);
assert.ok(/Nódulo no lobo direito, sólido/.test(f) && /TI-RADS 5/.test(f) && /1,8 cm/.test(f) && /American College of Radiology/.test(f), f); n++;

console.log(n + ' testes OK');

// Frase do laudo: em cada linha, ponto só no final
for (const l of f.split('\n')) assert.ok(!/\.\s/.test(l) && /[^.]\.$/.test(l), l);
console.log('frase com ponto só no final: OK');

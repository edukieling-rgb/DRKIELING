# Avaliação de laudos de raio X (SmartRIS / Espaço Rad)

Projeto do Dr. Kieling para avaliar a qualidade de laudos de radiografia.

## Regras invioláveis
- **Nunca** versionar dados de pacientes (nome, CPF, nascimento, ID, imagens DICOM, PDFs de laudos). Ver `.gitignore`.
- Só trabalhar com texto **anonimizado**. Se aparecer dado identificável, parar e avisar.
- Não colocar credenciais do SmartRIS no repositório; usar variáveis de ambiente / secrets.
- A avaliação é **apoio**: a decisão final é sempre do médico radiologista.

## Estrutura
- `criterios/`  critérios de avaliação (o que é um bom laudo, por região/exame)
- `prompts/`    prompts usados na avaliação
- `src/`        código (coleta/anonimização roda no PC local; avaliação roda em qualquer lugar)
- `tests/`      testes com dados sintéticos
- `dados_exemplo/` laudos **fictícios** para teste

## Fluxo
1. Coleta + anonimização (somente na rede da clínica) -> arquivos limpos.
2. Avaliação dos laudos anonimizados segundo `criterios/` e `prompts/`.
3. Relatório de resultados (sem identificação).

## Convenções
- Português nos textos e relatórios; commits claros e curtos.

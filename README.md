Fábrica de Conteúdo — W Digital
Sistema para encher o Instagram da W Digital com posts gerados por IA, com aprovação no meio, rodando 100% no plano gratuito do Make.
---
O fluxo, em uma frase
Toda semana o Make joga ideias na planilha → você aprova → o Make gera os slides das aprovadas → você abre o painel (template) e baixa os PNG prontos.
```
[Cenário 1: Ideias]  →  PLANILHA  ←  você aprova  →  [Cenário 2: Gera slides]  →  PAINEL (template)  →  baixa e posta
   (1x/semana)                                            (agendado)               (lê a planilha sozinho)
```
Você nunca escreve copy nem mexe em código. Só aprova e baixa.
---
1. Os 5 pilares
O rodízio que mantém variedade no feed (e evita 5 posts iguais por semana):
Pilar	O que é	Formato preferido
Autoridade	Dicas práticas de Meta/Google Ads	Carrossel
Bastidores	As automações e processos que você cria	Carrossel / Reel
Prova	Cases e resultados (anonimizados)	Carrossel / estático
Mercado	Mudanças e tendências das plataformas	Reel
Oferta	Chamada pro serviço, sem peso	Estático / carrossel curto
---
2. Estrutura da planilha (Google Sheets)
Crie uma aba chamada `Posts` com estas colunas (a ordem não importa, o template acha pelos nomes):
Coluna	Nome	Preenchido por	Conteúdo
A	Data	Cenário 1	data da geração da ideia
B	Pilar	Cenário 1	um dos 5 pilares
C	Tema	Cenário 1	a ideia do post
D	Aprovação	VOCÊ	`aprovado` / `reprovado` (deixe vazio = pendente)
E	Status	Cenário 2	`gerado` (vazio = ainda não gerou)
F	Slides_JSON	Cenário 2	o array de slides em JSON
O painel só exibe linhas onde Aprovação = `aprovado` e Status = `gerado`.
---
3. Os dois prompts
Prompt A — gerar IDEIAS (Cenário 1)
```
Você é estrategista de conteúdo da W Digital, marca de um gestor de tráfego pago
que atende empreendedores brasileiros (inclusive nos EUA).

Gere 5 ideias de post para Instagram, UMA para cada pilar abaixo:
- Autoridade: dica prática de Meta Ads ou Google Ads
- Bastidores: uma automação ou processo de tráfego que impressiona
- Prova: um aprendizado de case/resultado (sem citar cliente real)
- Mercado: uma mudança ou tendência atual das plataformas de anúncio
- Oferta: um convite pro serviço de gestão de tráfego

Regras:
- Cada tema deve ser específico e clicável, não genérico.
- Evite repetir temas óbvios já muito usados.

Responda APENAS com um array JSON válido, sem texto antes ou depois, neste formato:
[
  {"pilar":"Autoridade","tema":"..."},
  {"pilar":"Bastidores","tema":"..."},
  {"pilar":"Prova","tema":"..."},
  {"pilar":"Mercado","tema":"..."},
  {"pilar":"Oferta","tema":"..."}
]
```
Prompt B — gerar SLIDES (Cenário 2)
Injete `{{Pilar}}` e `{{Tema}}` da linha aprovada.
```
Você cria carrosséis para o Instagram da W Digital (gestor de tráfego pago).
Tom: direto, prático, sem enrolação, voltado para dono de negócio.

Pilar: {{Pilar}}
Tema: {{Tema}}

Crie um carrossel de 5 a 7 slides seguindo EXATAMENTE este esquema de objetos:
- 1 slide "cover": gancho forte no título, subtítulo curto no texto.
- 3 a 5 slides "tip": cada um com um ponto. Use "kicker" com o número ("01","02"...)
  e o "eyebrow" como rótulo do passo ("Erro 01", "Passo 02", "Dica 03"...).
  Inclua "chip" (com "big" = número/dado e "lbl" = legenda) só quando houver um dado forte.
- 1 slide "cta": chamada para salvar/seguir e um convite pra DM.

Regras de formatação:
- No título, destaque 1 a 2 palavras com <em>palavra</em>.
- Texto de cada slide: no máximo 2 frases curtas.
- Mantenha "theme":"dark" em todos os slides.

Responda APENAS com um array JSON válido (aspas duplas, sem vírgula sobrando,
sem markdown, sem texto fora do array), neste formato:
[
  {"type":"cover","theme":"dark","eyebrow":"...","title":"... <em>...</em> ...","text":"..."},
  {"type":"tip","theme":"dark","eyebrow":"Passo 01","kicker":"01","title":"...","text":"...","chip":{"big":"3x","lbl":"..."}},
  {"type":"tip","theme":"dark","eyebrow":"Passo 02","kicker":"02","title":"...","text":"..."},
  {"type":"cta","theme":"dark","eyebrow":"...","title":"... <em>me segue</em> ...","text":"..."}
]
```
> O texto inteiro que a IA devolver no Prompt B vai direto na célula **Slides_JSON**. O painel faz `JSON.parse` desse conteúdo — por isso ele precisa ser um array JSON válido.
Modelo: use Gemini (free tier) ou Claude via módulo HTTP do Make (1 crédito por chamada). Evite os módulos nativos de IA do Make, que consomem mais créditos.
---
4. Desenho dos 2 cenários no Make
Cenário 1 — Ideias (semanal)
Schedule → roda 1x/semana (ex.: segunda, 08:00). Agendado, não fica vigiando — isso protege os créditos.
HTTP › Make a request → POST para a API (Gemini/Claude) com o Prompt A.
Parse JSON → transforma a resposta no array de 5 ideias.
Iterator → percorre as 5 ideias.
Google Sheets › Add a Row → grava Data, Pilar, Tema. Deixa Aprovação, Status e Slides_JSON vazios.
(opcional) Telegram › Send a Message → “Ideias da semana prontas pra aprovar ✅”.
Custo: ~8 créditos/semana.
Cenário 2 — Geração (agendado)
Schedule → roda 2x/semana (ex.: quarta e sexta, 08:00) — ou diário, tanto faz.
Google Sheets › Search Rows → filtro: Aprovação = `aprovado` E Status vazio.
Iterator → percorre as linhas encontradas.
HTTP › Make a request → POST para a IA com o Prompt B (injeta Pilar e Tema da linha).
Parse / Set variable → isola o array JSON puro da resposta.
Google Sheets › Update a Row → grava Slides_JSON e marca Status = `gerado`.
Custo: ~12 créditos por execução. Com 5 posts/semana e 2 rodadas: ~24/semana.
Total de créditos
Os dois cenários somam ~140 créditos/mês mesmo com 5 posts/semana — contra os 1.000 do plano gratuito. Folga de ~85%.
> **Atenção ao limite de 2 cenários do grátis:** estes dois já ocupam o teto. Não dá pra ter um terceiro cenário ativo sem subir de plano. As linhas `reprovado` são simplesmente ignoradas pelo filtro do Cenário 2.
---
5. Publicar a planilha (pro painel ler sozinho)
Na planilha: Compartilhar → Qualquer pessoa com o link → Leitor.
Pegue o ID da planilha na URL — é o trecho entre `/d/` e `/edit`:
`docs.google.com/spreadsheets/d/``ESTE_PEDAÇO_É_O_ID``/edit`
No painel: cole o ID no campo, aba `Posts`, clique Carregar da planilha.
> Privacidade: com “qualquer pessoa com o link”, o conteúdo dos posts fica legível por quem tiver o link. Pra textos de marketing, sem problema. Não use essa planilha pra dados sensíveis.
---
6. Link fixo no GitHub Pages (opcional, recomendado)
Pra não depender do arquivo local e o `fetch` rodar liso:
Crie um repositório (ou use um existente) e suba o arquivo como `index.html`.
No `index.html`, preencha no topo do script:
`const CONFIG = { sheetId: "SEU_ID_AQUI", sheetName: "Posts" };`
No repo: Settings › Pages → Source: branch `main` → Save.
Em ~1 min sai a URL: `https://SEU_USUARIO.github.io/SEU_REPO/`
Favorita. Abriu, os posts aprovados da semana já aparecem montados.
---
7. Sua rotina semanal
Segunda — as ideias caem na planilha (Cenário 1 roda sozinho).
Durante a semana — você escreve `aprovado` ou `reprovado` na coluna Aprovação.
Quarta/Sexta — o Cenário 2 gera os slides das aprovadas.
Na hora de postar — abre o link do painel, vê os posts prontos, ajusta o que quiser na tela, alterna Dark/Light se fizer sentido, baixa os PNG e posta.
Pronto: conteúdo constante, marca consistente, sem escrever post na mão e sem custo.

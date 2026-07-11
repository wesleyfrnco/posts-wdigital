# Render automático dos carrosséis — W Digital

Renderiza os slides do `Slides_JSON` em JPEG 1080x1350 no GitHub Actions,
comita em `/posts/<id>/` e o GitHub Pages serve as URLs que o Instagram exige.

## Onde cada arquivo vive no repo do Pages

```
repo/
├─ .github/workflows/render-carousel.yml   ← workflow (renomeie a partir de render-carousel.yml)
├─ render/
│  ├─ render.html                          ← template de render (reaproveita seu CSS/slideHTML)
│  └─ render.js                            ← script Puppeteer
└─ posts/                                  ← criado automaticamente pelo Action
   └─ post-2026-07-13/
      ├─ slide-1.jpg ... slide-N.jpg
```

O `index.html` do painel continua onde está, intocado. Este render é paralelo.

## Esquema de URL (determinístico)

```
https://wesleyfrnco.github.io/posts-wdigital/posts/<id>/slide-<k>.jpg
```

- `<id>` = `post-<Data_Alvo>`  (ex.: `post-2026-07-13`)
- `<k>` = 1..N na ordem dos slides

Como o caminho é previsível, o **Make constrói as URLs sozinho** no momento do
Add a Row (Cenário A). O Action não precisa escrever de volta na planilha, então
ele **não precisa de credencial do Google** — só permissão de commit no próprio repo.

## Payload do dispatch (Cenário A → GitHub)

O Make dispara um `repository_dispatch` no fim do Cenário A:

```
POST https://api.github.com/repos/wesleyfrnco/posts-wdigital/dispatches
Headers:
  Authorization: Bearer <GITHUB_PAT com escopo repo>
  Accept: application/vnd.github+json
Body:
{
  "event_type": "render-carousel",
  "client_payload": {
    "posts": [
      { "id": "post-2026-07-13", "slides": [ ... Slides_JSON da linha ... ] },
      { "id": "post-2026-07-14", "slides": [ ... ] },
      { "id": "post-2026-07-15", "slides": [ ... ] },
      { "id": "post-2026-07-16", "slides": [ ... ] },
      { "id": "post-2026-07-17", "slides": [ ... ] }
    ]
  }
}
```

Um dispatch só, com os 5 posts da semana. O `slides` de cada post é o array que
o "atualizar planilha" já gera hoje (mesmo formato do `Slides_JSON`).

## Cenário A no Make — colunas a preencher por linha

Para cada uma das 5 linhas (iterator 1..5), no domingo 20h:

| Coluna        | Valor                                                                 |
|---------------|-----------------------------------------------------------------------|
| G `Data_Alvo` | `addDays(now; bundle_pos)` → seg..sex (formato `YYYY-MM-DD`)           |
| E `Status`    | `pendente`                                                            |
| H `Imagens_URLs` | as N URLs (uma por slide), separadas por vírgula, montadas com o id |
| I `Legenda`   | monta a partir do `Slides_JSON`: title+text do slide `cover` + text do `cta` + bloco fixo de hashtags |

`Imagens_URLs` (exemplo com 6 slides):
```
https://wesleyfrnco.github.io/posts-wdigital/posts/post-2026-07-13/slide-1.jpg,https://wesleyfrnco.github.io/posts-wdigital/posts/post-2026-07-13/slide-2.jpg,...,slide-6.jpg
```

## Cenário B (publicador, seg/qua/sex 19h)

Lê a linha onde `Data_Alvo = hoje` e `Status = pendente`, itera `Imagens_URLs`
criando um container filho por URL (`is_carousel_item=true`), depois o container
pai `CAROUSEL` com a lista de filhos + `caption = Legenda`, e publica o pai.
No fim, `Status = publicado`.

## Ponto de atenção

O Make grava as URLs no domingo, mas os JPEGs só existem depois que o Action
roda (segundos a poucos minutos). Como a publicação é seg/qua/sex, sempre há
folga. Recomendo adicionar um passo no fim do workflow que dispara um ping no
seu Telegram em caso de falha, pra você não descobrir só na hora de postar.

## Teste local (opcional)

```
cd render
npm install puppeteer@22 --no-save
PAYLOAD='{"posts":[{"id":"teste","slides":[{"type":"cover","title":"Oi","text":"mundo"}]}]}' node render.js
# gera posts/teste/slide-1.jpg
```

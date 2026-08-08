# Como trocar a logo do site pelo GitHub

A logo fica em **`public/logo.png`** e é usada no cabeçalho (`src/components/site/Header.tsx`)
através da configuração `logo` em `src/config/site.ts`.

## Jeito mais simples (recomendado)

1. Abra o repositório no GitHub.
2. Entre na pasta **`public`**.
3. Clique no arquivo **`logo.png`** → botão **`...`** → **Delete file** → **Commit changes**.
4. Ainda na pasta `public`, clique em **Add file → Upload files** e envie sua nova logo
   com exatamente o nome **`logo.png`**.
5. **Commit changes**. Em poucos segundos o site atualiza sozinho.

Dica: use PNG com fundo transparente, altura mínima de ~500 px.

## Se quiser usar outro nome de arquivo

1. Envie a imagem para a pasta `public/` (ex.: `public/logo-nova.png`).
2. Abra `src/config/site.ts` e altere:

```ts
logo: "/logo-nova.png",
```

3. **Commit changes**. Pronto.

## Favicon (ícone da aba do navegador)

Mesmo processo, substituindo o arquivo **`public/favicon.png`**.

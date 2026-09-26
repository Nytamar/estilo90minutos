# Upload de fotos direto no painel

Hoje o formulário de produto só aceita URLs coladas, e o projeto ainda não tem nenhum espaço de arquivos criado no backend — por isso links de imagens enviadas não abrem.

## O que será feito

1. **Criar o espaço de armazenamento público** chamado `product-images`, marcado como público para que qualquer URL gerada abra normalmente no site.
2. **Regras de acesso**: leitura liberada para qualquer visitante; envio, substituição e exclusão de arquivos apenas para contas com permissão de administrador.
3. **Formulário de produto**: adicionar um botão "Enviar fotos" ao lado do campo de URLs.
   - Seleção de um ou vários arquivos de imagem.
   - Cada arquivo é enviado automaticamente ao armazenamento e a URL pública é acrescentada à lista de imagens do produto.
   - Indicador de progresso enquanto envia e aviso de erro em caso de falha.
   - O campo de colar link continua funcionando exatamente como hoje.
   - Miniaturas das imagens já vinculadas, com opção de remover.
4. **Salvamento**: as URLs públicas são gravadas normalmente no campo de imagens do produto ao salvar.

## Detalhes técnicos

- Bucket criado via ferramenta de storage (`product-images`, public = true).
- Migração adicionando políticas em `storage.objects`: `SELECT` para `anon`/`authenticated` no bucket; `INSERT`/`UPDATE`/`DELETE` condicionados a `private.has_role(auth.uid(), 'admin')`.
- Upload no cliente com `supabase.storage.from('product-images').upload(path, file)`, path = `${crypto.randomUUID()}.${ext}`, seguido de `getPublicUrl`.
- Alteração restrita a `src/routes/admin.produtos.$id.tsx` (campo de imagens); nenhum outro layout ou estilo é alterado.

## Observação

Imagens já cadastradas com links externos quebrados precisarão ser reenviadas pelo novo botão de upload.

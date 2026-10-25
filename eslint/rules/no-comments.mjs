const ALLOWED_PREFIX = 'Por qué:';

const noComments = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      noComments: 'Sin comentarios: el código se explica solo. Única excepción: un comentario que empiece con "Por qué:".',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === 'Shebang' || comment.value.trim().startsWith(ALLOWED_PREFIX)) continue;
          context.report({ loc: comment.loc, messageId: 'noComments' });
        }
      },
    };
  },
};

export const localPlugin = { rules: { 'no-comments': noComments } };

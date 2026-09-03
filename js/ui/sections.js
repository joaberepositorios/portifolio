/* Monta as seções a partir de js/content.js.
   Cada bloco recebe os dados e devolve nós de DOM — nenhuma string de HTML.

   O desenho é editorial: réguas, número e tipografia no lugar de cartões. Os
   atributos `data-parallax` marcam o que desliza em relação à rolagem. */

(function (P) {
  'use strict';

  const { qs, el, fill, tag, list, icon, glyph, arrow } = P.dom;
  const modal = P.modal;
  const badges = P.badges;

  /* ---------- abertura ---------- */
  function renderIntro(content) {
    qs('#heroName').textContent = content.nome;
    qs('#heroLead').textContent = content.lead;
    qs('#aboutText').textContent = content.sobre;

    renderSocial(content.redes);

    /* O anel do retrato existe sempre — é ele que equilibra a abertura. Sem
       arquivo de foto, no lugar dela ficam as iniciais: marca o espaço em vez de
       deixar um buraco redondo. */
    const iniciais = content.nome.split(/\s+/).map((parte) => parte[0]).join('').slice(0, 2).toUpperCase();
    const dentro = el('div.retrato__foto', null, el('span.retrato__iniciais', { text: iniciais }));

    if (content.foto) {
      const imagem = el('img', { src: content.foto, alt: `Retrato de ${content.nome}`, loading: 'eager' });
      imagem.addEventListener('error', () => imagem.remove());
      fill(dentro, imagem);
    }

    fill(qs('#heroPortrait'), el('figure.retrato', null, dentro));
  }

  /* ---------- redes ---------- */
  const REDES = [
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['instagram', 'Instagram']
  ];

  function renderSocial(redes = {}, destino) {
    const links = REDES.map(([chave, nome]) => {
      const url = redes[chave];

      /* sem endereço o ícone continua ali, apagado: marca o lugar sem fingir
         um link que não leva a nada */
      if (!url) {
        return el('span.social__link.is-empty', {
          title: `${nome} — cole o endereço em js/content.js`,
          'aria-hidden': true
        }, icon(chave));
      }

      return el('a.social__link', {
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': nome
      }, icon(chave));
    });

    fill(destino || qs('#heroSocial'), el('nav.social', { 'aria-label': 'Redes' }, links));
  }

  /* ---------- linha do tempo ----------
     Três níveis: a instituição é o tópico maior, cada frente dentro dela é um
     subtópico, e os grupos de cada frente são as colunas. */
  function renderTimeline(content) {
    const rail = el('span.timeline__rail', { 'aria-hidden': true }, el('i.timeline__fill'));

    const items = content.timeline.map((item) =>
      el('article.tl-item', { dataset: { reveal: '' } }, [
        el('span.tl-item__node', { 'aria-hidden': true }),
        el('span.tl-item__period', { text: item.periodo, dataset: { parallax: '0.03' } }),
        el('h3', { text: item.titulo }),
        item.papel ? el('p.tl-item__role', { text: item.papel }) : null,
        ...frentesDe(item).map(frente)
      ])
    );

    fill(qs('#timeline'), [rail, ...items]);
  }

  /** Aceita a forma nova (com frentes) e a antiga (grupos direto no item). */
  function frentesDe(item) {
    if (item.frentes) return item.frentes;
    return item.grupos ? [{ grupos: item.grupos }] : [];
  }

  function frente(bloco) {
    return el('section.tl-frente', null, [
      bloco.titulo ? el('h4.tl-frente__titulo', { text: bloco.titulo }) : null,
      bloco.papel ? el('p.tl-frente__papel', { text: bloco.papel }) : null,
      bloco.descricao ? el('p.tl-frente__desc', { text: bloco.descricao }) : null,
      /* tópicos soltos (forma nova) ou colunas de grupos (forma antiga) */
      bloco.topicos ? list(bloco.topicos, '.tl-topico') : null,
      bloco.grupos
        ? el(
            'div.tl-groups',
            null,
            bloco.grupos.map((group) =>
              el('div.tl-group', null, [el('h5', { text: group.topico }), list(group.subtopicos)])
            )
          )
        : null
    ]);
  }

  /* ---------- projetos ----------
     A janela do cartão mostra **a cara do projeto**: uma imagem da tela dele,
     guardada em assets/img/. Sem capa, o vídeo tem a vez; sem os dois, fica o
     acabamento de espera. */
  function renderProjects(content) {
    const cards = content.projetos.map((project) => {
      const video = project.video || {};
      const playable = Boolean(video.src || video.youtubeId || video.link);

      if (project.capa) return cartaoDeCapa(project);

      const media = el(
        `div.project__media${video.src ? '' : '.is-empty'}`,
        {
          role: 'button',
          tabindex: 0,
          'aria-label': `Abrir vídeo — ${project.titulo}`
        },
        el('span.project__play', { 'aria-hidden': true }, icon('play'))
      );

      if (video.src) {
        const player = el('video', {
          src: video.src,
          muted: true,
          loop: true,
          playsInline: true,
          preload: 'metadata'
        });
        /* enquanto o arquivo não existe, a área fica com acabamento de placeholder */
        player.addEventListener('error', () => {
          media.classList.add('is-empty');
          player.remove();
        });
        media.prepend(player);
        autoplayInView(player);
      }

      const open = () => playable && modal.openVideo(video, project.titulo);
      media.addEventListener('click', open);
      media.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      return el('article.project', { dataset: { reveal: '' } }, [
        media,
        el('div.project__info', null, [
          el('h3', { text: project.titulo }),
          el('p.project__goal', { text: project.objetivo }),
          el('div.project__stack.tags', null, project.stack.map((item) => tag('#' + item))),
          acao(project, open)
        ])
      ]);
    });

    fill(qs('#projects'), cards);
  }

  /** Cartão cuja janela é a aparência do projeto: uma imagem da tela dele.
      É vitrine, não catálogo: sem etiqueta de linguagem, sem botão de acesso e
      sem link escondido na imagem — o endereço continua guardado em
      `js/content.js` para o dia em que fizer sentido voltar. */
  function cartaoDeCapa(project) {
    const imagem = el('img.project__capa', {
      src: project.capa,
      alt: `Tela do projeto ${project.titulo}`,
      loading: 'lazy'
    });

    const janela = el('div.project__media.project__media--capa', null, imagem);

    /* se o arquivo sumir, a moldura volta ao acabamento de espera em vez de
       deixar o ícone de imagem quebrada */
    imagem.addEventListener('error', () => {
      imagem.remove();
      janela.classList.add('is-empty');
    });

    return el('article.project', { dataset: { reveal: '' } }, [
      janela,
      el('div.project__info', null, [
        el('h3', { text: project.titulo }),
        el('p.project__goal', { text: project.objetivo })
      ])
    ]);
  }

  /** O convite do cartão: leva ao projeto quando há endereço; senão, abre o vídeo. */
  function acao(project, abrirVideo) {
    if (project.link) {
      return el('a.project__link', { href: project.link, target: '_blank', rel: 'noopener' },
        ['Acesse o site', arrow()]);
    }

    const botao = el('button.project__link', {
      type: 'button',
      'aria-label': `Abrir vídeo — ${project.titulo}`
    }, ['Ver o vídeo', arrow()]);
    botao.addEventListener('click', abrirVideo);
    return botao;
  }

  /** Vídeo de projeto só roda enquanto está em tela. */
  function autoplayInView(video) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(video);
  }

  /* ---------- artigos: só a vitrine ----------
     A capa é uma imagem da primeira página, em resolução baixa de propósito: o
     cartão mostra que o trabalho existe sem entregar o texto. Não há arquivo
     servido, então não há o que abrir, baixar ou imprimir a partir daqui. */
  function renderPapers(content) {
    const cards = content.artigos.map((paper) => {
      const capa = el('div.paper__capa', null, folha());

      if (paper.capa) {
        const arte = el('img.paper__arte', {
          src: paper.capa,
          alt: `Primeira página do artigo ${paper.titulo}`,
          loading: 'lazy',
          draggable: false
        });
        /* sem arquivo não sobra imagem quebrada: volta a folha desenhada */
        arte.addEventListener('error', () => arte.remove());
        /* o menu de contexto sobre a capa não abre: não é proteção, é atrito */
        arte.addEventListener('contextmenu', (evento) => evento.preventDefault());
        capa.prepend(arte);
      }

      return el('article.paper', { dataset: { reveal: '' } }, [
        capa,
        el('div.paper__info', { dataset: { parallax: '-0.05' } }, [
          el('h3', { text: paper.titulo }),
          el('p.paper__where', null, [el('span.eyebrow', { text: 'Publicado em' }), paper.evento])
        ])
      ]);
    });

    fill(qs('#papers'), cards);
  }

  /** Página em branco desenhada: é o que aparece se a imagem faltar. */
  const folha = () => el('span.paper__folha', { 'aria-hidden': true });

  /* ---------- competências: cartões com nível ----------
     Um cartão por tecnologia: logo da marca, nome e a barra do seu nível. O
     nível vem de `js/content.js` e pode estar em branco — nesse caso o cartão
     diz "a definir" em vez de inventar um número. As competências profissionais
     não têm marca nem nota: viram uma linha de etiquetas. */
  function renderSkills(content) {
    const blocos = content.competencias.map((grupo) =>
      el('article.skill', { dataset: { reveal: '' } }, [
        el('h3.skill__grupo', { text: grupo.grupo }),
        el('div.niveis', null, grupo.itens.map(cartaoNivel))
      ])
    );

    fill(qs('#skills'), blocos);
  }

  /** Cartão de uma tecnologia: marca, nome e barra. */
  function cartaoNivel(item) {
    const nome = typeof item === 'string' ? item : item.nome;
    const nivel = typeof item === 'string' ? null : item.nivel;
    const selo = badges.of(nome);
    const temNivel = typeof nivel === 'number';

    const marca = selo.tipo === 'logo'
      ? el(selo.razao > 2 ? 'span.badge.badge--largo' : 'span.badge', {
          style: `--fundo:${selo.fundo};--traco:${selo.traco};--razao:${selo.razao.toFixed(2)}`
        }, glyph(selo.box, selo.d))
      : el('span.badge.badge--sigla', { text: selo.sigla });
    marca.setAttribute('aria-hidden', 'true');

    const barra = el('div.nivel__barra', { role: 'img',
      'aria-label': temNivel ? `Nível ${nivel} de 100` : 'Nível a definir' },
      el('span.nivel__preenche', { style: `width:${temNivel ? nivel : 0}%` }));

    return el('article.nivel', null, [
      el('div.nivel__topo', null, [marca, el('h4', { text: nome })]),
      el('p.nivel__rotulo', null, [
        'Nível',
        el('b', { text: temNivel ? nivel + '%' : 'a definir' })
      ]),
      barra
    ]);
  }

  /** Um item: selo (logo oficial ou iniciais) mais o nome. */
  function seloItem(nome) {
    const selo = badges.of(nome);

    const largo = selo.tipo === 'logo' && selo.razao > 2;
    const marca = selo.tipo === 'logo'
      ? el(largo ? 'span.badge.badge--largo' : 'span.badge', {
          style: `--fundo:${selo.fundo};--traco:${selo.traco};--razao:${selo.razao.toFixed(2)}`
        }, glyph(selo.box, selo.d))
      : el('span.badge.badge--sigla', { text: selo.sigla });

    marca.setAttribute('aria-hidden', 'true');
    return el('li', null, [marca, el('span', { text: nome })]);
  }

  /* ---------- currículo: faixa de fecho ---------- */
  /* ---------- contato ----------
     Sem servidor e sem serviço de terceiro: o botão monta o `mailto:` e entrega
     a mensagem pronta ao programa de e-mail de quem escreveu. Enquanto não
     houver endereço em `content.contato.email`, o formulário diz isso em vez de
     fingir que enviou. */
  function renderContato(content) {
    const contato = content.contato || {};
    const destino = (contato.email || '').trim();

    qs('#contatoNota').textContent = contato.nota || '';

    const campo = (id, rotulo, tipo, obrigatorio) => {
      const entrada = tipo === 'area'
        ? el('textarea', { id, rows: 5, required: obrigatorio || null })
        : el('input', { id, type: tipo, required: obrigatorio || null, autocomplete: 'off' });
      return el('label.campo', null, [el('span', { text: rotulo }), entrada]);
    };

    const formulario = el('form.contato__form', null, [
      campo('cNome', 'Nome', 'text', true),
      campo('cEmail', 'E-mail', 'email', true),
      campo('cTelefone', 'Telefone (opcional)', 'tel', false),
      campo('cMensagem', 'Mensagem', 'area', true),
      el('div.contato__acoes', null, [
        el('button.botao', { type: 'submit' }, 'Enviar mensagem'),
        el('p.contato__aviso', { id: 'contatoAviso' },
          destino ? '' : 'Falta o e-mail de destino: preencha `contato.email` em js/content.js.')
      ])
    ]);

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const aviso = qs('#contatoAviso');

      if (!destino) {
        aviso.textContent = 'Sem endereço de destino ainda — preencha `contato.email` em js/content.js.';
        return;
      }

      const nome = qs('#cNome').value.trim();
      const email = qs('#cEmail').value.trim();
      const telefone = qs('#cTelefone').value.trim();
      const mensagem = qs('#cMensagem').value.trim();

      const corpo = [
        mensagem,
        '',
        '—',
        `Nome: ${nome}`,
        `E-mail: ${email}`,
        telefone ? `Telefone: ${telefone}` : null
      ].filter((linha) => linha !== null).join(String.fromCharCode(10));

      const url = `mailto:${destino}?subject=${encodeURIComponent('Contato pelo portfólio — ' + nome)}` +
        `&body=${encodeURIComponent(corpo)}`;

      aviso.textContent = 'Abrindo seu programa de e-mail com a mensagem pronta…';
      window.location.href = url;
    });

    const lado = el('div.contato__lado', null, [
      el('p.contato__linha', null, [
        el('span.eyebrow', { text: 'E-mail' }),
        destino
          ? el('a', { href: 'mailto:' + destino, text: destino })
          : el('span.contato__vazio', { text: 'a definir em js/content.js' })
      ]),
      el('div.contato__redes', { id: 'contatoRedes' })
    ]);

    fill(qs('#contato-corpo'), [formulario, lado]);
    renderSocial(content.redes, qs('#contatoRedes'));
  }

  /* ---------- entrada ---------- */
  function render(content) {
    renderIntro(content);
    renderTimeline(content);
    renderProjects(content);
    renderPapers(content);
    renderSkills(content);
    renderContato(content);
  }

  P.sections = { render };
})(window.Portfolio = window.Portfolio || {});

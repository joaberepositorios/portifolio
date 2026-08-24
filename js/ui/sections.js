/* Monta as seções a partir de js/content.js.
   Cada bloco recebe os dados e devolve nós de DOM — nenhuma string de HTML.

   O desenho é editorial: réguas, número e tipografia no lugar de cartões. Os
   atributos `data-parallax` marcam o que desliza em relação à rolagem. */

(function (P) {
  'use strict';

  const { qs, el, fill, tag, list, icon, glyph, arrow } = P.dom;
  const modal = P.modal;
  const badges = P.badges;

  /* largura de uma folha A4 em pixels de CSS, a 96dpi */
  const LARGURA_A4 = 794;

  /* ---------- abertura ---------- */
  function renderIntro(content) {
    qs('#heroName').textContent = content.nome;
    qs('#heroLead').textContent = content.lead;
    qs('#aboutText').textContent = content.sobre;

    renderSocial(content.redes);

    /* o retrato é opcional: sem arquivo (ou com arquivo quebrado) a moldura some
       inteira, em vez de deixar um círculo vazio na abertura */
    const slot = qs('#heroPortrait');
    if (!content.foto) return;

    const image = el('img', { src: content.foto, alt: `Retrato de ${content.nome}`, loading: 'eager' });
    const figure = el('figure.portrait', { dataset: { reveal: '' } }, image);
    image.addEventListener('error', () => figure.remove());
    fill(slot, figure);
  }

  /* ---------- redes ---------- */
  const REDES = [
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['instagram', 'Instagram'],
    ['youtube', 'YouTube']
  ];

  function renderSocial(redes = {}) {
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

    fill(qs('#heroSocial'), el('nav.social', { 'aria-label': 'Redes' }, links));
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

  /* ---------- projetos ---------- */
  function renderProjects(content) {
    const cards = content.projetos.map((project) => {
      const video = project.video || {};
      const playable = Boolean(video.src || video.youtubeId || video.link);

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
        el('div.project__info', { dataset: { parallax: '-0.05' } }, [
            el('h3', { text: project.titulo }),
          el('p.project__goal', { text: project.objetivo }),
          el('div.project__stack.tags', null, project.stack.map((item) => tag(item)))
        ])
      ]);
    });

    fill(qs('#projects'), cards);
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

  /* ---------- artigos: cartões com a capa do PDF ----------
     Mesma leitura dos projetos — uma grade que mostra o conjunto de uma vez.
     A capa é clicável e abre o PDF num modal rolável, sem baixar nada. */
  function renderPapers(content) {
    const cards = content.artigos.map((paper) => {
      const capa = el('div.paper__capa', {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Abrir PDF — ${paper.titulo}`
      }, el('span.paper__marca', { 'aria-hidden': true }, [icon('art'), 'PDF']));

      if (paper.capa) {
        const arte = el('img.paper__arte', { src: paper.capa, alt: '', loading: 'lazy' });
        arte.addEventListener('error', () => arte.remove());
        capa.prepend(arte);
      } else if (paper.pdf) {
        previewSobDemanda(capa, previewDePdf(paper.pdf));
      } else {
        capa.prepend(folha());
      }

      const abrir = () => paper.pdf && modal.openPdf(paper.pdf, paper.titulo);
      capa.addEventListener('click', abrir);
      capa.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          abrir();
        }
      });

      return el('article.paper', { dataset: { reveal: '' } }, [
        capa,
        el('div.paper__info', { dataset: { parallax: '-0.05' } }, [
          el('h3', { text: paper.titulo }),
          paper.autoria ? el('p.paper__papel', { text: paper.autoria }) : null,
          el('p.paper__where', null, [el('span.eyebrow', { text: 'Publicado em' }), paper.evento]),
          paper.descricao ? el('p.paper__desc', { text: paper.descricao }) : null,
          el('div.tags', null, [
            tag(paper.lingua),
            tag(paper.categoria, 'strong'),
            paper.ano ? tag(paper.ano) : null
          ]),
          paper.pdf ? pdfAction(paper.pdf, paper.titulo, 'Ler no site') : null
        ])
      ]);
    });

    fill(qs('#papers'), cards);
  }

  /** Página em branco desenhada: é o que aparece enquanto o PDF não existe. */
  const folha = () => el('span.paper__folha', { 'aria-hidden': true });

  /** A prévia do PDF só é montada quando o cartão chega à tela: instanciar o
      leitor de PDF é caro, e três deles no carregamento custariam a rolagem.
      É um `object` de propósito — se o arquivo não existe, o navegador desenha
      o conteúdo de reserva (a folha) em vez de deixar um retângulo quebrado. */
  function previewSobDemanda(capa, montar) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        capa.prepend(montar());
      }
    }, { rootMargin: '200px' });

    observer.observe(capa);
  }

  /** Prévia de um PDF: `object` para ter reserva quando o arquivo não existe. */
  const previewDePdf = (arquivo) => () => el('object.paper__preview', {
    data: `${arquivo}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1`,
    type: 'application/pdf',
    tabIndex: -1,
    'aria-hidden': true
  }, folha());

  /* ---------- competências: lista sequencial com os logos ----------
     Grupo em cima, itens em sequência embaixo — cada um com o selo da tecnologia,
     lido da esquerda para a direita como uma lista mesmo. */
  function renderSkills(content) {
    const rows = content.competencias.map((skill) =>
      el('article.skill', { dataset: { reveal: '' } }, [
        el('div.skill__body', null, [
          el('h3', { text: skill.grupo }),
          el('ul.skill__items', null, skill.itens.map(skill.tipo === 'texto' ? itemTexto : seloItem))
        ])
      ])
    );

    fill(qs('#skills'), rows);
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

  /** Competência sem marca: só o nome, com um traço no lugar do selo. */
  function itemTexto(nome) {
    return el('li.is-texto', null, [el('span', { text: nome })]);
  }

  /* ---------- currículo: faixa de fecho ---------- */
  /* ---------- currículo: a folha em exibição ----------
     A última seção mostra o próprio modelo, não um cartão falando dele. A prévia é
     `curr.html?vitrine=1` — a mesma página, sem a barra de edição — montada só
     quando chega à tela e inerte ao toque: o clique é da folha inteira, que abre o
     currículo no modal. */
  function renderCv(content) {
    const pagina = content.cv.pagina;
    const folha = el('div.cv__folha', {
      role: 'button',
      tabIndex: 0,
      'aria-label': 'Abrir o currículo'
    }, el('span.cv__marca', { 'aria-hidden': true }, [icon('art'), 'A4']));

    /* No modal entra a folha limpa: quem visita quer ler o currículo, não a barra
       de edição. Para editar e exportar existe o link ao lado, que abre a página
       inteira noutra aba. */
    const abrir = () => {
      if (pagina) modal.openPagina(`${pagina}?vitrine=1`, 'Currículo');
      else if (content.cv.arquivo) modal.openPdf(content.cv.arquivo, 'Currículo');
    };

    if (pagina) {
      previewSobDemanda(folha, () => {
        const preview = el('iframe.cv__preview', {
          src: `${pagina}?vitrine=1`,
          tabIndex: -1,
          'aria-hidden': true,
          loading: 'lazy',
          scrolling: 'no'
        });

        /* A página é montada na largura real de uma A4 (794px a 96dpi) e depois
           reduzida para caber na moldura. A conta fica aqui porque `scale()` só
           aceita número puro — `calc(300px / 794)` daria pixel, e o navegador
           descarta a regra inteira sem avisar. */
        const encaixar = () => {
          const escala = folha.clientWidth / LARGURA_A4;
          if (escala > 0) preview.style.transform = `scale(${escala.toFixed(4)})`;
        };

        encaixar();
        requestAnimationFrame(encaixar);
        if (typeof ResizeObserver === 'function') new ResizeObserver(encaixar).observe(folha);
        else addEventListener('resize', encaixar, { passive: true });

        return preview;
      });
    }

    folha.addEventListener('click', abrir);
    folha.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        abrir();
      }
    });

    const acao = el('button.action', { type: 'button' }, ['Abrir currículo', arrow()]);
    acao.addEventListener('click', abrir);

    fill(qs('#cvCard'), [
      el('div.cv__text', null, [
        el('h3', { text: 'Currículo atual' }),
        el('p', { text: content.cv.nota }),
        el('div.cv__acoes', null, [
          acao,
          pagina
            ? el('a.action.action--fraca', {
                href: pagina, target: '_blank', rel: 'noopener'
              }, ['Editar e exportar em PDF', arrow()])
            : null
        ])
      ]),
      folha
    ]);
  }

  function pdfAction(file, title, label) {
    const button = el('button.action', { type: 'button' }, [label, arrow()]);
    button.addEventListener('click', () => modal.openPdf(file, title));
    return button;
  }

  /* ---------- entrada ---------- */
  function render(content) {
    renderIntro(content);
    renderTimeline(content);
    renderProjects(content);
    renderPapers(content);
    renderSkills(content);
    renderCv(content);
  }

  P.sections = { render };
})(window.Portfolio = window.Portfolio || {});

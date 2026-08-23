# -*- coding: utf-8 -*-
"""Collada (.dae) -> geometria compacta para WebGL.

Preserva as cores de material do arquivo original, decima por agrupamento em grade
e reconstrói normais respeitando arestas vivas (crease). Saida: JS com base64.
"""
import base64
import json
import math
import os
import struct
import sys
import xml.etree.ElementTree as ET

NS = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}


def text_floats(node):
    return [float(x) for x in node.text.split()]


def text_ints(node):
    return [int(x) for x in node.text.split()]


def parse_dae(path):
    root = ET.parse(path).getroot()

    # efeito -> cor difusa
    effects = {}
    for eff in root.iter('{%s}effect' % NS['c']):
        col = None
        for tag in ('lambert', 'phong', 'blinn'):
            t = eff.find('.//c:%s/c:diffuse/c:color' % tag, NS)
            if t is not None:
                col = text_floats(t)[:3]
                break
        effects[eff.get('id')] = col or [0.5, 0.5, 0.5]

    # material -> cor
    materials = {}
    for mat in root.iter('{%s}material' % NS['c']):
        inst = mat.find('c:instance_effect', NS)
        materials[mat.get('id')] = effects.get(inst.get('url').lstrip('#'), [0.5, 0.5, 0.5])

    # fontes de cada geometria
    geoms = {}
    for geo in root.iter('{%s}geometry' % NS['c']):
        mesh = geo.find('c:mesh', NS)
        if mesh is None:
            continue
        sources = {}
        for src in mesh.findall('c:source', NS):
            arr = src.find('c:float_array', NS)
            acc = src.find('c:technique_common/c:accessor', NS)
            stride = int(acc.get('stride', '3')) if acc is not None else 3
            sources['#' + src.get('id')] = (text_floats(arr), stride)
        verts = mesh.find('c:vertices', NS)
        vsrc = verts.find('c:input[@semantic="POSITION"]', NS).get('source')
        sources['#' + verts.get('id')] = sources[vsrc]

        prims = []
        for prim in list(mesh.findall('c:triangles', NS)) + list(mesh.findall('c:polylist', NS)):
            inputs = {}
            maxoff = 0
            for inp in prim.findall('c:input', NS):
                off = int(inp.get('offset', '0'))
                maxoff = max(maxoff, off)
                inputs[inp.get('semantic')] = (inp.get('source'), off)
            stride = maxoff + 1
            p = text_ints(prim.find('c:p', NS))
            counts = None
            vc = prim.find('c:vcount', NS)
            if vc is not None:
                counts = text_ints(vc)
            prims.append({'mat': prim.get('material'), 'inputs': inputs,
                          'stride': stride, 'p': p, 'vcount': counts, 'sources': sources})
        geoms[geo.get('id')] = prims

    # cena: matriz do no + ligacao simbolo -> material
    out = []          # (matriz 4x4, primitivas, mapa simbolo->cor)
    for node in root.iter('{%s}node' % NS['c']):
        inst = node.find('c:instance_geometry', NS)
        if inst is None:
            continue
        m = node.find('c:matrix', NS)
        M = text_floats(m) if m is not None else [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        binds = {}
        for im in inst.findall('.//c:instance_material', NS):
            binds[im.get('symbol')] = materials.get(im.get('target').lstrip('#'), [0.5, 0.5, 0.5])
        gid = inst.get('url').lstrip('#')
        if gid in geoms:
            out.append((M, geoms[gid], binds))
    return out


def xform(M, p):
    return (M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3],
            M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7],
            M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11])


def collect(path):
    """triangulos agrupados por cor, ja no referencial do link."""
    groups = {}
    for M, prims, binds in parse_dae(path):
        for prim in prims:
            src, off = prim['inputs']['VERTEX']
            pos, stride_p = prim['sources'][src]
            p = prim['p']
            st = prim['stride']
            n = len(p) // st
            idx = [p[i * st + off] for i in range(n)]
            counts = prim['vcount'] or [3] * (n // 3)
            color = binds.get(prim['mat'], [0.5, 0.5, 0.5])
            key = tuple(round(c, 5) for c in color)
            tris = groups.setdefault(key, [])
            k = 0
            for cnt in counts:
                fan = idx[k:k + cnt]
                k += cnt
                for j in range(1, cnt - 1):
                    tri = []
                    for vi in (fan[0], fan[j], fan[j + 1]):
                        tri.append(xform(M, (pos[vi * stride_p], pos[vi * stride_p + 1], pos[vi * stride_p + 2])))
                    tris.append(tri)
    return groups


def cluster(tris, cell):
    def key(p):
        return (int(math.floor(p[0] / cell)), int(math.floor(p[1] / cell)), int(math.floor(p[2] / cell)))

    acc = {}
    for tri in tris:
        for p in tri:
            k = key(p)
            a = acc.get(k)
            if a is None:
                acc[k] = a = [0.0, 0.0, 0.0, 0]
            a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3] += 1
    rep = {}
    order = {}
    for k, a in acc.items():
        order[k] = len(order)
        rep[k] = (a[0] / a[3], a[1] / a[3], a[2] / a[3])

    seen = set()
    faces = []
    for tri in tris:
        ks = [key(p) for p in tri]
        if ks[0] == ks[1] or ks[1] == ks[2] or ks[0] == ks[2]:
            continue
        ids = [order[k] for k in ks]
        m = ids.index(min(ids))
        canon = (ids[m], ids[(m + 1) % 3], ids[(m + 2) % 3])
        if canon in seen:
            continue
        seen.add(canon)
        faces.append(ids)
    verts = [None] * len(order)
    for k, i in order.items():
        verts[i] = rep[k]
    return verts, faces


def decimate(tris, target):
    """procura o tamanho de celula que aproxima o numero de triangulos do alvo."""
    lo, hi = 0.0008, 0.05
    best = None
    for _ in range(18):
        cell = math.sqrt(lo * hi)
        verts, faces = cluster(tris, cell)
        if len(faces) > target:
            lo = cell
        else:
            hi = cell
            best = (verts, faces)
        if abs(len(faces) - target) < target * 0.05:
            best = (verts, faces)
            break
    if best is None:
        best = cluster(tris, hi)
    return best


def normals(verts, faces, crease=math.radians(38)):
    """normais suaves, quebrando em arestas vivas."""
    fn = []
    for f in faces:
        a, b, c = verts[f[0]], verts[f[1]], verts[f[2]]
        u = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
        v = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
        n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        L = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) or 1.0
        fn.append((n[0] / L, n[1] / L, n[2] / L, L / 2))

    incident = {}
    for i, f in enumerate(faces):
        for vi in f:
            incident.setdefault(vi, []).append(i)

    cos_c = math.cos(crease)
    out_pos, out_nrm, out_idx = [], [], []
    remap = {}
    for vi, fl in incident.items():
        buckets = []          # (normal media acumulada, peso, [faces])
        for fi in fl:
            n = fn[fi]
            placed = False
            for b in buckets:
                d = b[0][0] * n[0] + b[0][1] * n[1] + b[0][2] * n[2]
                if d / (math.sqrt(b[0][0] ** 2 + b[0][1] ** 2 + b[0][2] ** 2) or 1) >= cos_c:
                    b[0] = [b[0][0] + n[0] * n[3], b[0][1] + n[1] * n[3], b[0][2] + n[2] * n[3]]
                    b[1].append(fi)
                    placed = True
                    break
            if not placed:
                buckets.append([[n[0] * n[3], n[1] * n[3], n[2] * n[3]], [fi]])
        for b in buckets:
            L = math.sqrt(b[0][0] ** 2 + b[0][1] ** 2 + b[0][2] ** 2) or 1.0
            nid = len(out_pos)
            out_pos.append(verts[vi])
            out_nrm.append((b[0][0] / L, b[0][1] / L, b[0][2] / L))
            for fi in b[1]:
                remap[(fi, vi)] = nid
    for i, f in enumerate(faces):
        out_idx.extend(remap[(i, vi)] for vi in f)
    return out_pos, out_nrm, out_idx


def pack(link_groups):
    """empacota em binario: posicoes Int16 normalizadas + normais Int8 + indices Uint32."""
    blobs = []
    meta = {}
    offset = 0
    for link, groups in link_groups.items():
        entry = []
        for color, (pos, nrm, idx) in groups:
            mn = [min(p[i] for p in pos) for i in range(3)]
            mx = [max(p[i] for p in pos) for i in range(3)]
            scale = [(mx[i] - mn[i]) / 65534.0 or 1e-9 for i in range(3)]
            pb = bytearray()
            for p in pos:
                for i in range(3):
                    q = int(round((p[i] - mn[i]) / scale[i])) - 32767
                    pb += struct.pack('<h', max(-32768, min(32767, q)))
            nb = bytearray()
            for n in nrm:
                for i in range(3):
                    nb += struct.pack('<b', max(-127, min(127, int(round(n[i] * 127)))))
            wide = len(pos) > 65535
            ib = bytearray()
            for i in idx:
                ib += struct.pack('<I' if wide else '<H', i)
            def put(buf):
                nonlocal offset
                pad = (-len(buf)) % 4          # views tipadas exigem alinhamento
                blobs.append(bytes(buf) + bytes(pad))
                at = offset
                offset += len(buf) + pad
                return at
            p_off = put(pb); n_off = put(nb); i_off = put(ib)
            entry.append({
                'color': [round(c, 4) for c in color],
                'min': [round(v, 6) for v in mn],
                'scale': [s for s in scale],
                'count': len(pos), 'idx': len(idx), 'it': 4 if wide else 2,
                'p': p_off, 'n': n_off, 'i': i_off
            })
        meta[link] = entry
    return meta, b''.join(blobs)


# foot.dae não entra: a ponta preta da pata já faz parte de calf.dae
# (grupo de material "black foot end"), e desenhar as duas duplicava a peça.
TARGETS = {
    'base': 36000, 'hip': 7000, 'thigh': 7600, 'thigh_mirror': 7600,
    'calf': 7000, 'calf_mirror': 7000
}

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    link_groups = {}
    for name, target in TARGETS.items():
        path = os.path.join(src, name + '.dae')
        raw = collect(path)
        total_in = sum(len(t) for t in raw.values())
        groups = []
        for color, tris in raw.items():
            share = max(120, int(target * len(tris) / total_in))
            verts, faces = decimate(tris, share)
            groups.append((list(color), normals(verts, faces)))
        link_groups[name] = groups
        print('%-14s %7d -> %6d tri, %d grupos' % (
            name, total_in, sum(len(g[1][2]) // 3 for g in groups), len(groups)))

    meta, blob = pack(link_groups)
    b64 = base64.b64encode(blob).decode('ascii')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('/* Malhas do Unitree Go2 convertidas do URDF oficial\n')
        f.write('   (unitreerobotics/unitree_ros -> go2_description/dae/*.dae).\n')
        f.write('   Geometria decimada e quantizada; cores dos materiais originais. */\n')
        f.write('window.GO2_MESH = ' + json.dumps({'links': meta}, separators=(',', ':')) + ';\n')
        f.write('window.GO2_DATA = "' + b64 + '";\n')
    print('binario: %.0f KB | arquivo: %.0f KB' % (len(blob) / 1024, os.path.getsize(dst) / 1024))

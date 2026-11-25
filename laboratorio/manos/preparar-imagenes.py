"""Laboratorio de las manos: arma las imágenes que usa la animación.

Lee originales/manos/ (solo lectura) y escribe al lado de este archivo:
  mano-humana.webp   la mano humana tal cual, WebP con transparencia
  mano-cerrada.webp  la mano humana recortada de la referencia (con el hueco
                     del pulgar de bytes rellenado con la piel de alrededor)
  referencia.webp    la pose final, de acá se muestrean los bytes
  zonas.png          qué es cada zona de la referencia: rojo = bytes por
                     encima de la mano humana (pulgar y puntas de los dedos),
                     verde = cuerpo de la mano de bytes, azul = mano humana

Se corre solo si cambian las imágenes: python laboratorio/manos/preparar-imagenes.py
Necesita Pillow y numpy. No se publica.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

AQUI = Path(__file__).resolve().parent
ORIGEN = AQUI.parent.parent / 'originales' / 'manos'
W, H = 1672, 941

# Contornos trazados a mano sobre la referencia (píxeles de 1672 x 941)
HUMANA = [(0,88),(15,95),(50,109),(75,122),(97,137),(125,142),(155,147),(200,164),(240,182),(300,199),(350,214),(400,231),(424,238),(428,242),(428,247),
    (470,260),(490,264),(492,268),(491,274),(510,276),(525,281),(550,290),(575,294),(600,293),(612,291),(625,284),(650,275),(675,268),(700,259),(725,249),
    (740,241),(755,232),(770,229),(785,229),(800,234),(825,238),(850,242),(868,243),(862,300),(860,342),(875,350),(900,363),(925,378),(950,393),(975,413),
    (1000,433),(1025,450),(1050,473),(1070,489),(1085,505),(1100,525),(1112,543),(1122,560),(1126,575),(1124,592),(1122,605),(1115,618),(1103,627),(1090,631),
    (1077,626),(1064,620),(1055,611),(1045,600),(1030,583),(1015,565),(990,544),(970,531),(955,521),(946,513),(955,525),(975,545),(995,562),(1015,580),(1030,597),
    (1037,610),(1040,625),(1042,640),(1040,655),(1030,670),(1015,681),(1000,686),(985,683),(970,674),(963,667),(964,685),(958,700),(945,712),(925,722),(908,718),
    (895,712),(889,710),(885,728),(875,740),(860,748),(848,751),(830,748),(815,740),(800,720),(790,680),(750,650),(712,632),(665,615),(622,600),(603,595),(560,580),
    (532,561),(515,551),(500,540),(480,533),(450,526),(425,522),(411,520),(400,540),(385,555),(370,566),(355,570),(335,565),(322,560),(310,595),(298,622),(292,627),
    (285,625),(200,597),(100,559),(0,524)]
PULGAR = [(872,241),(850,246),(825,249),(800,249),(785,252),(772,264),(763,280),(756,297),(745,311),(728,322),(712,331),(702,342),(701,352),(707,363),(720,371),
    (735,376),(752,376),(770,371),(790,363),(805,353),(815,343),(830,340),(866,343),(872,300)]
DEDOS = [
    [(529,578),(535,562),(548,557),(565,556),(580,560),(592,569),(602,582),(604,595),(601,608),(592,619),(578,626),(560,625),(545,619),(534,606),(529,591)],
    [(601,607),(622,598),(645,580),(660,570),(678,566),(695,569),(709,579),(717,595),(717,608),(711,622),(695,641),(675,663),(660,675),(640,682),(625,679),(609,669),(599,654),(595,637)],
    [(690,650),(720,628),(740,611),(757,603),(770,607),(784,616),(791,630),(792,645),(786,660),(770,681),(755,698),(735,716),(720,725),(703,728),(687,721),(671,708),(665,692),(667,677),(678,664)],
    [(765,690),(780,664),(795,661),(806,663),(818,674),(824,692),(821,710),(808,732),(816,741),(795,753),(775,757),(755,751),(741,738),(735,722),(737,710),(750,700)],
]
CUERPO = [(866,243),(885,237),(905,236),(925,242),(950,261),(975,276),(1010,296),(1040,309),(1075,320),(1100,322),(1150,318),(1240,302),(1240,528),(1200,533),
    (1150,557),(1120,580),(1060,610),(1040,625),(940,515),(860,345)]


def poligono(puntos, escala=4):
    im = Image.new('L', (W * escala, H * escala), 0)
    ImageDraw.Draw(im).polygon([(x * escala, y * escala) for x, y in puntos], fill=255)
    return im.resize((W, H), Image.LANCZOS)


def unir(*capas):
    r = np.zeros((H, W), np.uint8)
    for c in capas:
        r = np.maximum(r, np.array(c))
    return r


def rellenar(rgb, hueco, vueltas=900):
    """Relleno por difusión: cada píxel del hueco toma el promedio de sus vecinos."""
    ys, xs = np.where(hueco)
    y0, y1, x0, x1 = ys.min() - 3, ys.max() + 4, xs.min() - 3, xs.max() + 4
    z = rgb[y0:y1, x0:x1].astype(np.float32)
    h = hueco[y0:y1, x0:x1]
    z[h] = z[~h].mean(axis=0)
    for _ in range(vueltas):
        p = (np.roll(z, 1, 0) + np.roll(z, -1, 0) + np.roll(z, 1, 1) + np.roll(z, -1, 1)) / 4
        z[h] = p[h]
    ruido = np.random.default_rng(1).normal(0, 3, h.shape)[..., None]
    z[h] = (z + ruido)[h]
    rgb[y0:y1, x0:x1] = np.clip(z, 0, 255).astype(np.uint8)


def main():
    ref = np.array(Image.open(ORIGEN / 'referencia-dos-manos').convert('RGB'))
    humana = np.array(Image.open(ORIGEN / 'mano-humana').convert('RGBA'))

    # Mano humana tal cual: solo se limpia el polvo casi invisible del fondo
    a = humana[..., 3].astype(np.float32)
    humana[..., 3] = np.clip((a - 24) * 255 / 231, 0, 255).astype(np.uint8)
    Image.fromarray(humana).save(AQUI / 'mano-humana.webp', quality=86, alpha_quality=95, method=6)

    contorno, pulgar = poligono(HUMANA), poligono(PULGAR)
    dedos = unir(*[poligono(d) for d in DEDOS])

    # Mano cerrada: recorte de la referencia con borde suave. El hueco es un
    # poco más grande que el pulgar, para no dejar su resplandor en la piel
    piel = ref.copy()
    hueco = np.array(pulgar.filter(ImageFilter.MaxFilter(15))) > 40
    sobra = np.array(contorno) > 20
    ys, xs = np.mgrid[0:H, 0:W]
    fuera = hueco & ~sobra          # por arriba no hay piel de donde tomar
    valido = hueco & sobra
    piel[fuera] = piel[255, 745]
    rellenar(piel, valido)
    hueco_dedos = (np.array(Image.fromarray(dedos).filter(ImageFilter.MaxFilter(9))) > 40) & sobra
    piel[(np.array(Image.fromarray(dedos)) > 40) & ~sobra] = piel[540, 700]
    rellenar(piel, hueco_dedos)
    alfa = contorno.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    Image.fromarray(np.dstack([piel, np.array(alfa)])).save(AQUI / 'mano-cerrada.webp', quality=86, alpha_quality=95, method=6)

    Image.fromarray(ref).save(AQUI / 'referencia.webp', quality=88, method=6)

    z = np.zeros((H, W, 3), np.uint8)
    z[..., 0] = unir(pulgar, dedos)
    z[..., 1] = np.array(poligono(CUERPO))
    z[..., 2] = np.array(contorno.filter(ImageFilter.MaxFilter(7)))
    Image.fromarray((z > 127).astype(np.uint8) * 255).save(AQUI / 'zonas.png', optimize=True)
    for n in ('mano-humana.webp', 'mano-cerrada.webp', 'referencia.webp', 'zonas.png'):
        print(n, round((AQUI / n).stat().st_size / 1024), 'KB')


if __name__ == '__main__':
    main()

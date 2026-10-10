/*
 * Cada TIPO de sección tiene su color, y dentro de una sección no se mezclan colores.
 * Paleta formal de CRM empresarial: azul marino, esmeralda, pizarra, dorado y petróleo.
 *
 *   menu         Navegación: menú lateral, barra de arriba, títulos y botones principales.
 *   indicadores  Cifras y resultados: resumen de hoy, totales, porcentajes.
 *   personas     Organización: empleados, trabajadores, cuentas.
 *   control      Accesos: roles y permisos.
 *   dispositivos Equipos conectados: checador y sus marcas.
 *
 * Para cambiar el color de un tipo de sección, cámbialo solo aquí.
 *  - suave:  fondo claro con texto oscuro (íconos, iniciales, etiquetas)
 *  - fuerte: fondo sólido con texto blanco (lo elegido / activo)
 *  - texto:  solo el color del texto o del ícono
 *  - marcado: borde y fondo de una tarjeta elegida
 */
export const COLOR_SECCION = {
  menu: {
    suave: 'bg-primary/10 text-primary',
    fuerte: 'bg-primary text-primary-foreground',
    texto: 'text-primary',
    marcado: 'border-primary/40 bg-primary/5',
  },
  indicadores: {
    suave: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    fuerte: 'bg-emerald-700 text-white',
    texto: 'text-emerald-700 dark:text-emerald-300',
    marcado: 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10',
  },
  personas: {
    suave: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    fuerte: 'bg-slate-700 text-white',
    texto: 'text-slate-600 dark:text-slate-300',
    marcado: 'border-slate-300 bg-slate-50 dark:border-slate-500/40 dark:bg-slate-500/10',
  },
  control: {
    suave: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    fuerte: 'bg-amber-700 text-white',
    texto: 'text-amber-700 dark:text-amber-300',
    marcado: 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10',
  },
  dispositivos: {
    suave: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
    fuerte: 'bg-cyan-800 text-white',
    texto: 'text-cyan-700 dark:text-cyan-300',
    marcado: 'border-cyan-300 bg-cyan-50/60 dark:border-cyan-500/40 dark:bg-cyan-500/10',
  },
}

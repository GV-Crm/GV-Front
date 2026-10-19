import type { ContactoEmergencia, DatosPersonales } from './api'

/** Lo que se edita en el formulario: todo como texto ('' = sin capturar). */
export type FormDatosPersonales = Record<Exclude<keyof DatosPersonales, 'ContactosEmergencia'>, string> & {
  ContactosEmergencia: ContactoEmergencia[]
}

export const MAX_CONTACTOS = 3

export const CONTACTO_VACIO: ContactoEmergencia = { Nombre: '', Parentesco: '', Telefono: '' }

export const FORM_VACIO: FormDatosPersonales = {
  FechaNacimiento: '',
  Celular: '',
  Correo: '',
  CURP: '',
  RFC: '',
  NSS: '',
  Domicilio: '',
  ContactosEmergencia: [],
}

export function aFormulario(datos: DatosPersonales): FormDatosPersonales {
  return {
    FechaNacimiento: datos.FechaNacimiento ?? '',
    Celular: datos.Celular ?? '',
    Correo: datos.Correo ?? '',
    CURP: datos.CURP ?? '',
    RFC: datos.RFC ?? '',
    NSS: datos.NSS ?? '',
    Domicilio: datos.Domicilio ?? '',
    ContactosEmergencia: datos.ContactosEmergencia,
  }
}

const vacioANull = (valor: string) => valor.trim() || null

/** Formato que espera el backend. Él valida y corrige mayúsculas, espacios y el +52 de los teléfonos. */
export function aDatos(form: FormDatosPersonales): DatosPersonales {
  return {
    FechaNacimiento: vacioANull(form.FechaNacimiento),
    Celular: vacioANull(form.Celular),
    Correo: vacioANull(form.Correo),
    CURP: vacioANull(form.CURP),
    RFC: vacioANull(form.RFC),
    NSS: vacioANull(form.NSS),
    Domicilio: vacioANull(form.Domicilio),
    ContactosEmergencia: form.ContactosEmergencia.filter((c) => c.Nombre.trim() || c.Parentesco.trim() || c.Telefono.trim()),
  }
}

/** ¿Se capturó algo? En el alta, si no, no se mandan datos personales. */
export function tieneDatos(form: FormDatosPersonales): boolean {
  const { ContactosEmergencia, ...campos } = aDatos(form)
  return ContactosEmergencia.length > 0 || Object.values(campos).some((valor) => valor !== null)
}

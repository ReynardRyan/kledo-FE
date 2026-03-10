import { Form, useLoaderData, useSubmit } from 'react-router-dom'
import { useMemo, useRef } from 'react'

export async function loader({ request }) {
  const url = new URL(request.url)
  let province = url.searchParams.get('province') || ''
  let regency = url.searchParams.get('regency') || ''
  let district = url.searchParams.get('district') || ''

  const res = await fetch('/data/dummyData.json')
  const data = await res.json()

  const regenciesByProvinceId = new Map()
  for (const r of data.regencies || []) {
    const provinceId = String(r.province_id)
    const list = regenciesByProvinceId.get(provinceId) || []
    list.push({
      id: String(r.id),
      name: r.name,
    })
    regenciesByProvinceId.set(provinceId, list)
  }

  const districtsByRegencyId = new Map()
  for (const d of data.districts || []) {
    const regencyId = String(d.regency_id)
    const list = districtsByRegencyId.get(regencyId) || []
    list.push({
      id: String(d.id),
      name: d.name,
    })
    districtsByRegencyId.set(regencyId, list)
  }

  const provinces = (data.provinces || []).map((p) => {
    const provinceId = String(p.id)
    const regencies = (regenciesByProvinceId.get(provinceId) || []).map((r) => ({
      ...r,
      districts: districtsByRegencyId.get(r.id) || [],
    }))
    return {
      id: provinceId,
      name: p.name,
      regencies,
    }
  })

  const provinceOk = provinces.some((p) => p.id === province)
  if (!provinceOk) {
    province = ''
    regency = ''
    district = ''
  } else {
    const selectedProvince = provinces.find((p) => p.id === province) || null
    const regencyOk = selectedProvince?.regencies?.some((r) => r.id === regency) || false
    if (!regencyOk) {
      regency = ''
      district = ''
    } else {
      const selectedRegency =
        selectedProvince?.regencies?.find((r) => r.id === regency) || null
      const districtOk =
        selectedRegency?.districts?.some((d) => d.id === district) || false
      if (!districtOk) district = ''
    }
  }

  return {
    regions: { provinces },
    filters: { province, regency, district },
  }
}

function findById(list, id) {
  if (!id) return null
  return list.find((x) => String(x.id) === String(id)) || null
}

export default function Root() {
  const { regions, filters } = useLoaderData()
  const submit = useSubmit()
  const formRef = useRef(null)

  const selectedProvince = useMemo(
    () => findById(regions.provinces, filters.province),
    [regions, filters.province]
  )
  const regencies = useMemo(
    () => selectedProvince?.regencies || [],
    [selectedProvince]
  )
  const selectedRegency = useMemo(
    () => findById(regencies, filters.regency),
    [regencies, filters.regency]
  )
  const districts = useMemo(
    () => selectedRegency?.districts || [],
    [selectedRegency]
  )
  const selectedDistrict = useMemo(
    () => findById(districts, filters.district),
    [districts, filters.district]
  )

  const onProvinceChange = (e) => {
    const fd = new FormData()
    fd.set('province', e.target.value)
    fd.set('regency', '')
    fd.set('district', '')
    submit(fd, { method: 'get' })
  }
  const onRegencyChange = (e) => {
    const fd = new FormData()
    fd.set('province', filters.province)
    fd.set('regency', e.target.value)
    fd.set('district', '')
    submit(fd, { method: 'get' })
  }
  const onDistrictChange = (e) => {
    const fd = new FormData()
    fd.set('province', filters.province)
    fd.set('regency', filters.regency)
    fd.set('district', e.target.value)
    submit(fd, { method: 'get' })
  }
  const onReset = () => {
    const fd = new FormData()
    submit(fd, { method: 'get' })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-80 border-r border-slate-300 bg-slate-100 px-6 py-8 overflow-y-auto">
          <div className="mb-8 flex items-center gap-3">
            <h1 className="font-semibold text-base">Frontend Assessment</h1>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 tracking-widest mb-6">
            FILTER WILAYAH
          </div>

          <Form ref={formRef} method="get" className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 tracking-widest mb-2">
                PROVINSI
              </label>
              <div className="relative">
                <select
                  name="province"
                  value={filters.province}
                  onChange={onProvinceChange}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Pilih Provinsi</option>
                  {regions.provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 tracking-widest mb-2">
                KOTA/KABUPATEN
              </label>
              <div className="relative">
                <select
                  name="regency"
                  value={filters.regency}
                  onChange={onRegencyChange}
                  disabled={!selectedProvince}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <option value="">
                    {selectedProvince ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi dulu'}
                  </option>
                  {regencies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 tracking-widest mb-2">
                KECAMATAN
              </label>
              <div className="relative">
                <select
                  name="district"
                  value={filters.district}
                  onChange={onDistrictChange}
                  disabled={!selectedRegency}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <option value="">
                    {selectedRegency ? 'Pilih Kecamatan' : 'Pilih Kota/Kabupaten dulu'}
                  </option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400 bg-white px-4 py-2.5 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:border-sky-500 hover:bg-sky-50 active:scale-[0.99]"
            >
              RESET
            </button>
          </Form>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-300 bg-white px-6 py-4">
            <div className="flex items-center justify-start">
              <nav className="breadcrumb text-sm text-slate-400">
                <span>Indonesia</span>
                {selectedProvince && <span className="mx-2">›</span>}
                {selectedProvince && (
                  <span className="text-slate-700">{selectedProvince.name}</span>
                )}
                {selectedRegency && <span className="mx-2">›</span>}
                {selectedRegency && (
                  <span className="text-slate-700">{selectedRegency.name}</span>
                )}
                {selectedDistrict && <span className="mx-2">›</span>}
                {selectedDistrict && (
                  <span className="text-sky-600 font-medium">
                    {selectedDistrict.name}
                  </span>
                )}
              </nav>
            </div>
          </header>

          <section className="flex-1 bg-slate-100 px-8 py-8">
            <main className="h-full">
              <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
                <div className="w-full px-10 py-12">
                  <div className="text-[11px] font-semibold text-slate-500 tracking-widest mb-4">
                    PROVINSI
                  </div>
                  <div className="text-5xl font-black tracking-tight text-slate-900">
                    {selectedProvince ? selectedProvince.name : '-'}
                  </div>

                  <div className="my-10 flex justify-center text-slate-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5v14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7 14l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 tracking-widest mb-4">
                    KOTA / KABUPATEN
                  </div>
                  <div className="text-5xl font-black tracking-tight text-slate-900">
                    {selectedRegency ? selectedRegency.name : '-'}
                  </div>

                  <div className="my-10 flex justify-center text-slate-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5v14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7 14l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 tracking-widest mb-4">
                    KECAMATAN
                  </div>
                  <div className="text-5xl font-black tracking-tight text-slate-900">
                    {selectedDistrict ? selectedDistrict.name : '-'}
                  </div>
                </div>
              </div>
            </main>
          </section>
        </div>
      </div>
    </div>
  )
}

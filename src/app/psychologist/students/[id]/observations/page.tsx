import { api } from "@/lib/mock-api"
import { Button } from "@/components/ui/button"

export default async function StudentObservationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const observations = await api.getObservations(id)

  return (
    <div className="max-w-4xl pt-space-md">
      <div className="flex justify-end mb-space-md">
        <Button variant="outline" className="text-primary font-label-md">
          New Observation
        </Button>
      </div>

      <div className="relative border-l-2 border-surface-variant ml-4 md:ml-6 space-y-space-lg pb-space-xl">
        {observations.map((obs) => (
          <div key={obs.id} className="relative pl-space-lg md:pl-space-xl">
            {/* Marker */}
            <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-surface border-2 z-10 ${obs.confidential ? 'border-primary' : 'border-outline'}`}></div>
            
            {/* Card */}
            <div className={`bg-surface rounded-xl border border-outline-variant p-space-md md:p-space-lg shadow-[0px_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group ${obs.confidential ? 'hover:border-primary-fixed-dim' : ''}`}>
              {obs.confidential && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              )}
              
              <div className="flex justify-between items-start mb-space-sm">
                <div className="flex items-center gap-space-sm">
                  {obs.confidential ? (
                     <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                        <span className="font-label-md text-label-md text-primary font-bold">Clinical Note</span>
                     </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface font-label-md font-bold">
                        {obs.observerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="block font-label-md text-label-md text-on-surface font-semibold">{obs.observerName}</span>
                        <span className="block font-label-md text-label-md text-on-surface-variant">{obs.observerRole}</span>
                      </div>
                    </>
                  )}
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">{new Date(obs.date).toLocaleDateString()}</span>
              </div>
              
              {!obs.confidential && (
                <span className="inline-block px-2 py-1 bg-secondary-container text-on-secondary-container font-label-md text-[10px] uppercase tracking-wider rounded-md mb-space-sm">
                  {obs.type}
                </span>
              )}
              
              <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">{obs.type}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
                {obs.details}
              </p>
              
              {obs.confidential && (
                <div className="bg-surface-container-low rounded p-space-sm border border-outline-variant inline-flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">visibility_off</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Restricted access: Psych team only</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {observations.length === 0 && (
          <div className="pl-space-lg text-on-surface-variant">
            No observations recorded for this student.
          </div>
        )}

        {observations.length > 0 && (
          <div className="relative pl-space-lg md:pl-space-xl pt-space-md flex justify-center">
            <Button variant="outline" className="rounded-full flex items-center gap-space-xs text-primary bg-surface hover:bg-surface-container-low font-semibold border-outline-variant">
              <span className="material-symbols-outlined text-[18px]">history</span>
              Load Previous Observations
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

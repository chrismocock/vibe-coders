import StageWorkspace from "@/components/StageWorkspace";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Project {params.id}</h1>
          <p className="text-neutral-600">Detailed workspace view for each stage.</p>
        </div>
        <StageWorkspace projectId={params.id} />
      </div>
    </div>
  );
}



import StageWorkspace from "@/components/StageWorkspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <StageWorkspace projectId={id} hideSidebar={true} />
  );
}



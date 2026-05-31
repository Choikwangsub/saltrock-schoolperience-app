import { ContactSection } from "@/components/ContactSection";
import { getPrograms } from "@/lib/programs";

export default function ContactPage() {
  const programs = getPrograms();

  return <ContactSection programs={programs} />;
}

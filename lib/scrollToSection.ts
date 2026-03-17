export function scrollToSectionById(sectionId: string) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return false;
  }

  section.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  window.history.replaceState(null, "", `/#${sectionId}`);

  return true;
}

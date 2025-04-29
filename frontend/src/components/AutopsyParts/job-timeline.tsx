import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Autopsy } from "@/lib/api/autopsies";

interface JobTimelineProps {
  autopsy: Autopsy;
}

export function JobTimeline({ autopsy }: JobTimelineProps) {
  // Determine current project phase based on autopsy status
  const getCurrentPhase = (status?: string): number => {
    if (!status) return 1;
    
    switch (status) {
      case "ΝΕΟ":
        return 1; // Autopsy phase
      case "ΑΠΟΣΤΟΛΗ":
        return 2; // Soilwork phase
      case "ΜΗ ΟΛΟΚΛΗΡΩΣΗ":
        return 3; // Construction phase
      case "ΟΛΟΚΛΗΡΩΣΗ":
        return 8; // Complete
      case "ΑΠΟΡΡΙΨΗ":
        return 0; // Rejected
      default:
        return 1;
    }
  };

  const currentPhase = getCurrentPhase(autopsy.status);
  
  // Calculate estimated dates based on the created date
  const createdDate = autopsy.createdAt ? new Date(autopsy.createdAt) : new Date();
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Create timeline with dynamic dates based on actual creation date
  const timelineEvents = [
    {
      date: formatDate(createdDate),
      title: "Έναρξη Έργου",
      description: "Ολοκληρώθηκε η αρχική αυτοψία και καθορίστηκε το πεδίο εφαρμογής του έργου",
      status: currentPhase >= 1 ? "completed" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000)), // 3 days after
      title: "Εγκρίθηκαν οι Άδειες",
      description: "Εγκρίθηκαν όλες οι απαραίτητες άδειες για εκσκαφή και εγκατάσταση",
      status: currentPhase >= 2 ? "completed" : currentPhase === 1 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5 days after
      title: "Έναρξη Χωματουργικών",
      description: autopsy.cAB ? `Ξεκίνησε η εκσκαφή για την τοποθέτηση αγωγών προς CAB ${autopsy.cAB}` : "Ξεκίνησε η εκσκαφή για την εγκατάσταση υπόγειων αγωγών",
      status: currentPhase >= 3 ? "completed" : currentPhase === 2 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 10 * 24 * 60 * 60 * 1000)), // 10 days after
      title: "Εγκατάσταση Αγωγών",
      description: "Εγκαταστάθηκαν υπόγειοι αγωγοί και έγινε επιχωμάτωση",
      status: currentPhase >= 4 ? "completed" : currentPhase === 3 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000)), // 15 days after
      title: "Εγκατάσταση Καλωδίου Οπτικών Ινών",
      description: "Τοποθέτηση καλωδίου οπτικών ινών μέσω αγωγών",
      status: currentPhase >= 5 ? "completed" : currentPhase === 4 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 18 * 24 * 60 * 60 * 1000)), // 18 days after
      title: "Εργασίες Συγκόλλησης",
      description: "Συγκόλληση και τερματισμός καλωδίου οπτικών ινών",
      status: currentPhase >= 6 ? "completed" : currentPhase === 5 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 21 * 24 * 60 * 60 * 1000)), // 21 days after
      title: "Τεχνική Επαλήθευση",
      description: "Τελικές δοκιμές και έλεγχοι διασφάλισης ποιότητας",
      status: currentPhase >= 7 ? "completed" : currentPhase === 6 ? "in-progress" : "pending",
    },
    {
      date: formatDate(new Date(createdDate.getTime() + 25 * 24 * 60 * 60 * 1000)), // 25 days after
      title: "Ολοκλήρωση Έργου",
      description: `Παράδοση στον πελάτη ${autopsy.customerName || ""} και ενεργοποίηση υπηρεσίας`,
      status: currentPhase >= 8 ? "completed" : currentPhase === 7 ? "in-progress" : "pending",
    },
  ];

  // Handle rejected projects
  if (autopsy.status === "ΑΠΟΡΡΙΨΗ") {
    timelineEvents.push({
      date: formatDate(autopsy.modifiedAt ? new Date(autopsy.modifiedAt) : new Date()),
      title: "Έργο Απορρίφθηκε",
      description: autopsy.sxolia || "Το έργο απορρίφθηκε. Δεν θα προχωρήσει σε περαιτέρω στάδια.",
      status: "rejected"
    });
  }

  // Customize based on specific autopsy data
  if (autopsy.sxolia && autopsy.status !== "ΑΠΟΡΡΙΨΗ") {
    const notesEvent = {
      date: formatDate(autopsy.modifiedAt ? new Date(autopsy.modifiedAt) : new Date()),
      title: "Σημειώσεις Έργου",
      description: autopsy.sxolia,
      status: "note" as "note"
    };
    
    // Insert notes after current phase
    const insertIndex = timelineEvents.findIndex(event => 
      event.status === "in-progress" || 
      (event.status === "pending" && timelineEvents.some(e => e.status === "completed"))
    );
    
    if (insertIndex !== -1) {
      timelineEvents.splice(insertIndex + 1, 0, notesEvent);
    } else {
      timelineEvents.push(notesEvent);
    }
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
      <div className="space-y-6">
        {timelineEvents.map((event, index) => (
          <div key={index} className="relative pl-8">
            <div
              className={`absolute left-0 p-1 rounded-full ${
                event.status === "completed"
                  ? "bg-green-100"
                  : event.status === "in-progress"
                    ? "bg-blue-100"
                    : event.status === "rejected"
                      ? "bg-red-100"
                      : event.status === "note"
                        ? "bg-yellow-100"
                        : "bg-gray-100"
              }`}
            >
              {event.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : event.status === "in-progress" ? (
                <Clock className="h-5 w-5 text-blue-600" />
              ) : event.status === "rejected" ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : event.status === "note" ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-md font-medium">{event.title}</h3>
              <span className="text-sm text-muted-foreground">{event.date}</span>
              {event.status === "in-progress" && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Σε Εξέλιξη</span>
              )}
              {event.status === "rejected" && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Απορρίφθηκε</span>
              )}
              {event.status === "note" && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Σημείωση</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
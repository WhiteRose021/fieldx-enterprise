import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, AlertCircle, FileText, ImageIcon, Upload, 
  Download, Clipboard, Calendar, Clock, Briefcase, Users 
} from "lucide-react";
import Image from "next/image";
import { Autopsy } from "@/lib/api/autopsies";

interface JobDetailsProps {
  jobType: "autopsy" | "soilwork" | "construction" | "splicing" | "technical";
  title: string;
  description: string;
  autopsy: Autopsy;
  isEditing?: boolean;
}

export function JobDetails({ jobType, title, description, autopsy, isEditing = false }: JobDetailsProps) {
  // Function to determine job phase status based on autopsy status
  const getJobStatus = (type: string, status?: string): string => {
    if (!status) return "pending";
    
    // Different job phases have different statuses based on the overall autopsy status
    switch (status) {
      case "ΟΛΟΚΛΗΡΩΣΗ":
        return "completed"; // All phases completed
      case "ΜΗ ΟΛΟΚΛΗΡΩΣΗ":
        return type === "autopsy" || type === "soilwork" || type === "construction" 
          ? "completed" 
          : type === "splicing" ? "in-progress" : "pending";
      case "ΑΠΟΣΤΟΛΗ":
        return type === "autopsy" ? "completed" : 
               type === "soilwork" ? "in-progress" : "pending";
      case "ΝΕΟ":
        return type === "autopsy" ? "in-progress" : "pending";
      case "ΑΠΟΡΡΙΨΗ":
        return "rejected";
      default:
        return "pending";
    }
  };

  // Generate dates for job phases
  const getJobDate = (type: string): { start: string, end: string } => {
    const baseDate = autopsy.createdAt ? new Date(autopsy.createdAt) : new Date();
    
    // Date offset in days from base date
    const offsets = {
      autopsy: { start: 0, end: 2 },
      soilwork: { start: 3, end: 9 },
      construction: { start: 10, end: 17 },
      splicing: { start: 18, end: 21 },
      technical: { start: 22, end: 25 }
    };
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('el-GR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    const offset = offsets[type as keyof typeof offsets];
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + offset.start);
    
    const endDate = new Date(baseDate);
    endDate.setDate(baseDate.getDate() + offset.end);
    
    return {
      start: formatDate(startDate),
      end: formatDate(endDate)
    };
  };

  // Job status based on autopsy status
  const jobStatus = getJobStatus(jobType, autopsy.status);
  
  // Job dates
  const jobDates = getJobDate(jobType);

  // Sample data for different job types - we can personalize with autopsy data
  const jobData = {
    autopsy: {
      status: jobStatus,
      startDate: jobDates.start,
      endDate: jobDates.end,
      team: autopsy.teamsNames ? Object.values(autopsy.teamsNames)[0] || "Ομάδα Αυτοψίας" : "Ομάδα Αυτοψίας",
      supervisor: autopsy.assignedUserName || "Κώστας Αντωνίου",
      tasks: [
        { name: "Αρχική Επίσκεψη", status: jobStatus === "completed" || jobStatus === "in-progress" ? "completed" : "pending", notes: "Ολοκληρώθηκε χωρίς προβλήματα" },
        { name: "Αξιολόγηση Τοποθεσίας", status: jobStatus === "completed" ? "completed" : jobStatus === "in-progress" ? "in-progress" : "pending", notes: `Τοποθεσία: ${autopsy.aDDRESSStreet || ""} ${autopsy.aDDRESSCity || ""}` },
        { name: "Φωτογραφική Τεκμηρίωση", status: jobStatus === "completed" ? "completed" : "pending", notes: "Λήψη φωτογραφιών" },
        { name: "Μετρήσεις Αποστάσεων", status: jobStatus === "completed" ? "completed" : "pending", notes: "Καταγραφή απαραίτητων μετρήσεων" },
        { name: "Σύνταξη Έκθεσης", status: jobStatus === "completed" ? "completed" : "pending", notes: autopsy.sxolia || "Σύνταξη αναφοράς αυτοψίας" },
      ],
      materials: [
        { name: "Εξοπλισμός Μέτρησης", quantity: "1 σετ", status: "Χρησιμοποιήθηκε" },
        { name: "Κάμερα", quantity: "1 μονάδα", status: "Χρησιμοποιήθηκε" },
        { name: "Tablet Καταγραφής", quantity: "1 μονάδα", status: "Χρησιμοποιήθηκε" },
      ],
      issues: autopsy.sxolia ? [
        {
          description: "Σημειώσεις Αυτοψίας",
          resolution: "Καταγράφηκαν λεπτομέρειες",
          impact: autopsy.sxolia
        }
      ] : [],
      images: [
        "/placeholder.svg", 
        "/placeholder.svg"
      ],
    },
    soilwork: {
      status: jobStatus,
      startDate: jobDates.start,
      endDate: jobDates.end,
      team: autopsy.teamsNames && Object.values(autopsy.teamsNames).length > 1 ? 
        Object.values(autopsy.teamsNames)[1] : "Ομάδα Εκσκαφών",
      supervisor: "Μιχάλης Ιωάννου",
      tasks: [
        { name: "Αυτοψία Χώρου", status: jobStatus === "completed" || jobStatus === "in-progress" ? "completed" : "pending", notes: "Έλεγχος περιοχής εκσκαφής" },
        { name: "Σήμανση Δικτύων", status: jobStatus === "completed" ? "completed" : jobStatus === "in-progress" ? "in-progress" : "pending", notes: "Καταγραφή υφιστάμενων δικτύων" },
        { name: "Εκσκαφή", status: jobStatus === "completed" ? "completed" : "pending", notes: `Διάνοιξη τάφρου προς ${autopsy.aDDRESSStreet || "οδό εγκατάστασης"}` },
        { name: "Τοποθέτηση Αγωγών", status: jobStatus === "completed" ? "completed" : "pending", notes: "Εγκατάσταση αγωγού" },
        { name: "Επιχωμάτωση", status: jobStatus === "completed" ? "completed" : "pending", notes: "Κλείσιμο τάφρου μετά την εγκατάσταση" },
      ],
      materials: [
        { name: "Αγωγός PVC", quantity: "25μ", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
        { name: "Ταινία Προειδοποίησης", quantity: "25μ", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
        { name: "Άμμος Εγκιβωτισμού", quantity: "2 τόνοι", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
      ],
      issues: [],
      images: ["/placeholder.svg"],
    },
    construction: {
      status: jobStatus,
      startDate: jobDates.start,
      endDate: jobDates.end,
      team: "Ομάδα Κατασκευών",
      supervisor: "Σοφία Βασιλείου",
      tasks: [
        { name: "Εγκατάσταση Εξοπλισμού", status: jobStatus === "completed" || jobStatus === "in-progress" ? "completed" : "pending", notes: "Μεταφορά εξοπλισμού στην τοποθεσία" },
        { name: "Επιθεώρηση Αγωγών", status: jobStatus === "completed" ? "completed" : jobStatus === "in-progress" ? "in-progress" : "pending", notes: "Έλεγχος εγκατεστημένων αγωγών" },
        { name: "Τράβηγμα Καλωδίων", status: jobStatus === "completed" ? "completed" : "pending", notes: "Εγκατάσταση καλωδίων οπτικών ινών" },
        { name: "Κατασκευή Σημείου Εισόδου", status: jobStatus === "completed" ? "completed" : "pending", notes: `Εγκατάσταση εισόδου στο κτίριο ${autopsy.bUILDINGID || ""}` },
        { name: "Εγκατάσταση Τερματικού", status: jobStatus === "completed" ? "completed" : "pending", notes: "Τερματισμός καλωδίωσης" },
      ],
      materials: [
        { name: "Καλώδιο Οπτικών Ινών", quantity: "30μ", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
        { name: "Κουτί Διακλάδωσης", quantity: "1 μονάδα", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
      ],
      issues: [],
      images: [],
    },
    splicing: {
      status: jobStatus,
      startDate: jobDates.start,
      endDate: jobDates.end,
      team: "Ομάδα Συγκολλήσεων",
      supervisor: "Μάρκος Δημητρίου",
      tasks: [
        { name: "Προετοιμασία Ινών", status: jobStatus === "completed" || jobStatus === "in-progress" ? "completed" : "pending", notes: "Προετοιμασία άκρων οπτικών ινών" },
        { name: "Εγκατάσταση Σημείων Συγκόλλησης", status: jobStatus === "completed" ? "completed" : jobStatus === "in-progress" ? "in-progress" : "pending", notes: "Εγκατάσταση σημείων σύνδεσης" },
        { name: "Συγκόλληση Τήξης", status: jobStatus === "completed" ? "completed" : "pending", notes: "Συγκόλληση άκρων" },
        { name: "Προστασία Συγκολλήσεων", status: jobStatus === "completed" ? "completed" : "pending", notes: "Προστασία συνδέσεων" },
        { name: "Δοκιμές OTDR", status: jobStatus === "completed" ? "completed" : "pending", notes: "Έλεγχος ποιότητας συγκολλήσεων" },
      ],
      materials: [
        { name: "Κουτί Συγκολλήσεων", quantity: "1 μονάδα", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
        { name: "Προστατευτικά Συγκολλήσεων", quantity: "12 μονάδες", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
      ],
      issues: [],
      images: [],
    },
    technical: {
      status: jobStatus,
      startDate: jobDates.start,
      endDate: jobDates.end,
      team: "Τεχνική Ομάδα",
      supervisor: "Ελένη Παπαδοπούλου",
      tasks: [
        { name: "Δοκιμές Επιπέδου Ισχύος", status: jobStatus === "completed" || jobStatus === "in-progress" ? "completed" : "pending", notes: "Μέτρηση ισχύος σήματος" },
        { name: "Δοκιμές Εύρους Ζώνης", status: jobStatus === "completed" ? "completed" : jobStatus === "in-progress" ? "in-progress" : "pending", notes: "Έλεγχος ταχύτητας σύνδεσης" },
        { name: "Επαλήθευση Άκρο-προς-Άκρο", status: jobStatus === "completed" ? "completed" : "pending", notes: "Έλεγχος ολοκληρωμένης σύνδεσης" },
        { name: "Εγκατάσταση ONT", status: jobStatus === "completed" ? "completed" : "pending", notes: `Τερματικός εξοπλισμός στο κτίριο ${autopsy.bUILDINGID || ""}` },
        { name: "Επίδειξη σε Πελάτη", status: jobStatus === "completed" ? "completed" : "pending", notes: `Επίδειξη λειτουργίας στον πελάτη ${autopsy.customerName || ""}` },
      ],
      materials: [
        { name: "Μετρητής Οπτικής Ισχύος", quantity: "1 μονάδα", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
        { name: "Συσκευή ONT", quantity: "1 μονάδα", status: jobStatus === "completed" ? "Χρησιμοποιήθηκε" : "Προγραμματισμένο" },
      ],
      issues: [],
      images: [],
    },
  };

  // Get the specific data for this job type
  const data = jobData[jobType as keyof typeof jobData];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Badge
          className={`${
            data.status === "completed"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : data.status === "in-progress"
                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                : data.status === "rejected"
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }`}
        >
          {data.status === "completed" 
            ? "Ολοκληρώθηκε" 
            : data.status === "in-progress" 
              ? "Σε Εξέλιξη" 
              : data.status === "rejected"
                ? "Απορρίφθηκε"
                : "Προγραμματισμένο"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Ημερομηνία Έναρξης</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.startDate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Ημερομηνία Λήξης</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.endDate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Ανατεθειμένη Ομάδα</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.team}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>Επιβλέπων</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.supervisor}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <Clipboard className="h-4 w-4" />
            <span>Εργασίες</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Υλικά</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>Προβλήματα</span>
            {data.issues.length > 0 && (
              <Badge className="ml-1 bg-red-100 text-red-800 hover:bg-red-100">{data.issues.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <span>Τεκμηρίωση</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          {isEditing ? (
            <div className="space-y-4">
              {data.tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`task-${index}-name`}>Εργασία</Label>
                      <Input id={`task-${index}-name`} defaultValue={task.name} />
                    </div>
                    <div>
                      <Label htmlFor={`task-${index}-status`}>Κατάσταση</Label>
                      <select
                        id={`task-${index}-status`}
                        defaultValue={task.status}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="pending">Εκκρεμεί</option>
                        <option value="in-progress">Σε Εξέλιξη</option>
                        <option value="completed">Ολοκληρώθηκε</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`task-${index}-notes`}>Σημειώσεις</Label>
                      <Textarea id={`task-${index}-notes`} defaultValue={task.notes} rows={1} />
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full">+ Προσθήκη Εργασίας</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Εργασία</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead className="hidden md:table-cell">Σημειώσεις</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tasks.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {task.status === "completed"
                          ? "Ολοκληρώθηκε"
                          : task.status === "in-progress"
                            ? "Σε Εξέλιξη"
                            : "Εκκρεμεί"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{task.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Λεπτομέρειες
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end mt-4">
            {!isEditing && (
              <>
                <Button variant="outline" size="sm" className="mr-2">
                  Προσθήκη Εργασίας
                </Button>
                <Button size="sm">Ενημέρωση Εργασιών</Button>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          {isEditing ? (
            <div className="space-y-4">
              {data.materials.map((material, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`material-${index}-name`}>Υλικό</Label>
                      <Input id={`material-${index}-name`} defaultValue={material.name} />
                    </div>
                    <div>
                      <Label htmlFor={`material-${index}-quantity`}>Ποσότητα</Label>
                      <Input id={`material-${index}-quantity`} defaultValue={material.quantity} />
                    </div>
                    <div>
                      <Label htmlFor={`material-${index}-status`}>Κατάσταση</Label>
                      <Input id={`material-${index}-status`} defaultValue={material.status} />
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full">+ Προσθήκη Υλικού</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Υλικό</TableHead>
                  <TableHead>Ποσότητα</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.materials.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Λεπτομέρειες
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end mt-4">
            {!isEditing && (
              <>
                <Button variant="outline" size="sm" className="mr-2">
                  Προσθήκη Υλικού
                </Button>
                <Button size="sm">Ενημέρωση Αποθέματος</Button>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          {isEditing ? (
            <div className="space-y-4">
              {data.issues.length > 0 ? (
                data.issues.map((issue, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor={`issue-${index}-description`}>Περιγραφή Προβλήματος</Label>
                        <Input id={`issue-${index}-description`} defaultValue={issue.description} />
                      </div>
                      <div>
                        <Label htmlFor={`issue-${index}-resolution`}>Επίλυση</Label>
                        <Input id={`issue-${index}-resolution`} defaultValue={issue.resolution} />
                      </div>
                      <div>
                        <Label htmlFor={`issue-${index}-impact`}>Επίπτωση</Label>
                        <Textarea id={`issue-${index}-impact`} defaultValue={issue.impact} rows={2} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Δεν έχουν καταχωρηθεί προβλήματα για αυτή τη φάση.</p>
                </div>
              )}
              <Button className="w-full">+ Προσθήκη Προβλήματος</Button>
            </div>
          ) : (
            <>
              {data.issues.length > 0 ? (
                <div className="space-y-4">
                  {data.issues.map((issue, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md font-medium">
                          Πρόβλημα #{index + 1}: {issue.description}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Επίλυση</p>
                            <p className="text-sm text-muted-foreground">{issue.resolution}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Επίπτωση</p>
                            <p className="text-sm text-muted-foreground">{issue.impact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" className="mr-2">
                      Προσθήκη Προβλήματος
                    </Button>
                    <Button size="sm">Δημιουργία Αναφοράς</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Δεν Αναφέρθηκαν Προβλήματα</h3>
                  <p className="text-muted-foreground">Αυτή η φάση του έργου δεν έχει αναφερόμενα προβλήματα.</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Αναφορά Προβλήματος
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="mt-4">
          {isEditing ? (
            <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Σύρετε αρχεία εδώ</h3>
              <p className="text-sm text-muted-foreground mb-4">Ή επιλέξτε αρχεία προς μεταφόρτωση</p>
              <Button size="sm">Επιλογή Αρχείων</Button>
            </div>
          ) : (
            <>
              {data.images.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {data.images.map((image, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Εικόνα τεκμηρίωσης ${index + 1}`}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-2 flex justify-between items-center">
                          <span className="text-sm">Εικόνα {index + 1}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2 flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      <span>Μεταφόρτωση</span>
                    </Button>
                    <Button className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>Λήψη Όλων</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Δεν Υπάρχει Διαθέσιμη Τεκμηρίωση</h3>
                  <p className="text-muted-foreground">Δεν έχουν μεταφορτωθεί εικόνες ή έγγραφα για αυτή τη φάση.</p>
                  <Button className="mt-4 flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    <span>Μεταφόρτωση Τεκμηρίωσης</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
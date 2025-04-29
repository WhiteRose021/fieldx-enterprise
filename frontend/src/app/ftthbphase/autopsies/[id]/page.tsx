"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, Shovel, HardHat, Scissors, WrenchIcon, AlertCircle, 
  Loader2, ArrowLeft, Download, Edit, Save, Calendar, Clock 
} from "lucide-react";
import { useAutopsy, useUpdateAutopsy } from "@/lib/api/autopsies";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { CustomerInfo } from "@/components/AutopsyParts/customer-info";
import GoogleMap from "@/components/Maps/GoogleMap";
import { JobTimeline } from "@/components/AutopsyParts/job-timeline";
import { JobDetails } from "@/components/AutopsyParts/job-details";
import { AppointmentScheduler } from "@/components/AutopsyParts/appointment-scheduler";
import { useToast } from "@/hooks/use-toast";
import WeatherForecast from "@/components/WeatherForecast/WeatherForecast";
import MinimalWeatherForecast from "@/components/WeatherForecast/MinimalWeatherForecast";

// Helper function for formatting dates
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper function for getting status badge class
const getStatusBadgeClass = (status: string | undefined) => {
  if (!status) return "bg-yellow-100 text-yellow-800 border border-yellow-300";

  const colors: Record<string, string> = {
    "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border border-green-300",
    "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border border-blue-300",
    "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
    "ΑΠΟΡΡΙΨΗ": "bg-gray-100 text-gray-800 border border-gray-300",
    "ΝΕΟ": "bg-purple-100 text-purple-800 border border-purple-300",
  };
  return colors[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
};

export default function AutopsyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("autopsy");

  // Data fetching with the hook
  const { data: autopsy, isLoading, error } = useAutopsy(id);
  const updateAutopsyMutation = useUpdateAutopsy();

  // Calculate progress based on status
  const calculateProgress = (status?: string): number => {
    if (!status) return 0;
    
    const progressMap: Record<string, number> = {
      "ΝΕΟ": 10,
      "ΑΠΟΣΤΟΛΗ": 40,
      "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": 60,
      "ΟΛΟΚΛΗΡΩΣΗ": 100,
      "ΑΠΟΡΡΙΨΗ": 0
    };
    
    return progressMap[status] || 25;
  };

  // Handle save action
  const handleSave = async () => {
    try {
      if (!autopsy) {
        toast({
          title: "Σφάλμα",
          description: "Δεν βρέθηκαν δεδομένα για αποθήκευση",
          variant: "destructive",
        });
        return;
      }

      // Here we would collect edited data from form fields
      // For now, just saving the original data as demo
      await updateAutopsyMutation.mutateAsync({
        id: autopsy.id,
        data: autopsy, // Replace with actual edited data
      });

      toast({
        title: "Επιτυχία",
        description: "Οι αλλαγές αποθηκεύτηκαν με επιτυχία.",
        variant: "success",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating autopsy:", error);
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση των αλλαγών.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <div className="text-lg text-gray-600">Φόρτωση στοιχείων αυτοψίας...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !autopsy) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <div className="text-xl font-bold text-gray-800 mb-2">Σφάλμα</div>
          <div className="text-gray-600 mb-6">
            Δεν ήταν δυνατή η φόρτωση των στοιχείων της αυτοψίας.
          </div>
          <Link
            href="/ftthbphase/autopsies"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Επιστροφή στη λίστα
          </Link>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Extract lat/long from autopsy data
  const latitude = autopsy.latitude ? parseFloat(autopsy.latitude) : undefined;
  const longitude = autopsy.longitude ? parseFloat(autopsy.longitude) : undefined;

  // Construct address for GoogleMap
  const address = [
    autopsy.aDDRESSStreet,
    autopsy.aDDRESSCity,
    autopsy.aDDRESSPostalCode,
    autopsy.aDDRESSCountry,
  ]
    .filter(Boolean)
    .join(", ") || "Τοποθεσία Εγκατάστασης";

  // Calculate progress percentage based on status
  const progress = calculateProgress(autopsy.status);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 space-y-4">
        {/* Back button */}
        <div className="mb-6 mt-4">
          <Link
            href="/ftthbphase/autopsies"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Επιστροφή στη λίστα</span>
          </Link>
        </div>

        {/* Header with title and actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SR: {autopsy.name || "-"}</h1>
            <p className="text-muted-foreground">Κωδικός Εγκατάστασης: {autopsy.orderNumber || "-"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeClass(autopsy.status)}>
              {autopsy.status || "Άγνωστη Κατάσταση"}
            </Badge>
            
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Ακύρωση
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Αποθήκευση
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Επεξεργασία
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Εξαγωγή PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Customer and Progress sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-1 pt-3">
              <CardTitle>Πληροφορίες Πελάτη</CardTitle>
              <CardDescription>Τοποθεσία εγκατάστασης και στοιχεία επικοινωνίας</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerInfo autopsy={autopsy} isEditing={isEditing} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle>Κατάσταση Έργου</CardTitle>
              <CardDescription>Τρέχουσα πρόοδος εγκατάστασης</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Συνολική Πρόοδος</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Ημερομηνία Έναρξης</span>
                    <span className="font-medium">
                      {formatDate(autopsy.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Τελευταία Ενημέρωση</span>
                    <span className="font-medium">
                      {formatDate(autopsy.modifiedAt)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Ανατεθειμένη Ομάδα</span>
                    <span className="font-medium">
                      {autopsy.teamsNames && Object.keys(autopsy.teamsNames).length > 0
                        ? Object.values(autopsy.teamsNames).join(", ")
                        : "Μη ανατεθειμένο"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Υπεύθυνος</span>
                    <span className="font-medium">{autopsy.assignedUserName || "Μη ανατεθειμένο"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map and Weather sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-1 pt-3">
              <CardTitle>Τοποθεσία</CardTitle>
              <CardDescription>Προβολή χάρτη τοποθεσίας εγκατάστασης</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {latitude && longitude && !isNaN(latitude) && !isNaN(longitude) ? (
                <GoogleMap 
                  latitude={autopsy.latitude} 
                  longitude={autopsy.longitude}
                  address={`${autopsy.aDDRESSStreet}, ${autopsy.aDDRESSCity}, ${autopsy.aDDRESSPostalCode}, ΕΛΛΑΔΑ`}
                />
              ) : (
                <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-gray-500">Μη διαθέσιμα στοιχεία τοποθεσίας</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
  <CardHeader className="pb-1 pt-3">
    <CardTitle>Πρόγνωση Καιρού</CardTitle>
    <CardDescription>Καιρικές συνθήκες στην τοποθεσία εγκατάστασης</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {autopsy.latitude && autopsy.longitude ? (
      <MinimalWeatherForecast 
        latitude={autopsy.latitude} 
        longitude={autopsy.longitude} 
        locationName={autopsy.aDDRESSCity || "Δ. " + autopsy.aDDRESSCity}
      />
    ) : (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
        <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-500 text-center">Δεν υπάρχουν διαθέσιμες συντεταγμένες για την πρόγνωση καιρού</p>
      </div>
    )}
  </CardContent>
</Card>
        </div>

        {/* Timeline section */}
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle>Χρονοδιάγραμμα Εγκατάστασης</CardTitle>
            <CardDescription>Επισκόπηση όλων των δραστηριοτήτων εγκατάστασης</CardDescription>
          </CardHeader>
          <CardContent>
            <JobTimeline autopsy={autopsy} />
          </CardContent>
        </Card>

        {/* Job Details section */}
        <Tabs defaultValue="autopsy" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="autopsy" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Αυτοψία</span>
            </TabsTrigger>
            <TabsTrigger value="soilwork" className="flex items-center gap-2">
              <Shovel className="h-4 w-4" />
              <span>Χωματουργικά</span>
            </TabsTrigger>
            <TabsTrigger value="construction" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              <span>Κατασκευή</span>
            </TabsTrigger>
            <TabsTrigger value="splicing" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              <span>Συγκόλληση</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <WrenchIcon className="h-4 w-4" />
              <span>Τεχνικός Έλεγχος</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="autopsy" className="mt-4">
            <JobDetails
              jobType="autopsy"
              title="Λεπτομέρειες Αυτοψίας"
              description="Αρχική αξιολόγηση και προγραμματισμός εργασιών"
              autopsy={autopsy}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="soilwork" className="mt-4">
            <JobDetails
              jobType="soilwork"
              title="Λεπτομέρειες Χωματουργικών"
              description="Εκσκαφή και προετοιμασία υπόγειων εργασιών"
              autopsy={autopsy}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="construction" className="mt-4">
            <JobDetails
              jobType="construction"
              title="Λεπτομέρειες Κατασκευής"
              description="Εγκατάσταση αγωγών και δομικές εργασίες"
              autopsy={autopsy}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="splicing" className="mt-4">
            <JobDetails
              jobType="splicing"
              title="Λεπτομέρειες Συγκόλλησης"
              description="Συγκόλληση και τερματισμός οπτικών ινών"
              autopsy={autopsy}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            <JobDetails
              jobType="technical"
              title="Λεπτομέρειες Τεχνικού Ελέγχου"
              description="Τελική επαλήθευση και διασφάλιση ποιότητας"
              autopsy={autopsy}
              isEditing={isEditing}
            />
          </TabsContent>
        </Tabs>

        {/* Appointments section */}
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle>Προγραμματισμός Ραντεβού</CardTitle>
            <CardDescription>Διαχείριση ραντεβού εγκατάστασης</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentScheduler autopsy={autopsy} />
          </CardContent>
        </Card>

        {/* System Details section */}
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle>Στοιχεία Συστήματος</CardTitle>
            <CardDescription>Πληροφορίες καταχώρησης και διαχείρισης</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Δημιουργήθηκε: {formatDate(autopsy.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Τελευταία τροποποίηση: {formatDate(autopsy.modifiedAt)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Δημιουργήθηκε από</span>
                  <p className="font-medium">{autopsy.createdByName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Τροποποιήθηκε από</span>
                  <p className="font-medium">{autopsy.modifiedByName || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">ID Συστήματος</span>
                  <p className="font-medium">{autopsy.id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Κατηγορία</span>
                  <p className="font-medium">{autopsy.cATEGORY || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
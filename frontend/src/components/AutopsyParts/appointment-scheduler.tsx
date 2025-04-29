"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CalendarIcon, Plus, User, Briefcase, MapPin, FileText, CheckCircle } from "lucide-react";
import { Autopsy } from "@/lib/api/autopsies";
import { useToast } from "@/hooks/use-toast";

interface AppointmentSchedulerProps {
  autopsy: Autopsy;
}

interface Appointment {
  id: number;
  title: string;
  date: string;
  time: string;
  team: string;
  contact: string;
  status: string;
  type: string;
  notes?: string;
  location?: string;
}

export function AppointmentScheduler({ autopsy }: AppointmentSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    date: "",
    time: "9:00",
    type: "autopsy",
    team: "",
    contact: "",
    notes: "",
  });
  const { toast } = useToast();

  // Generate appointments based on autopsy data when component mounts
  useEffect(() => {
    // Creating appointments based on the autopsy status and data
    const generatedAppointments: Appointment[] = [];
    const createdDate = autopsy.createdAt ? new Date(autopsy.createdAt) : new Date();
    
    // Format date in the required format
    const formatAppointmentDate = (date: Date): string => {
      return date.toLocaleDateString('el-GR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // Generate initial autopsy appointment (in the past)
    generatedAppointments.push({
      id: 1,
      title: "Αρχική Αυτοψία",
      date: formatAppointmentDate(createdDate),
      time: "09:00 - 11:00",
      team: autopsy.teamsNames ? Object.values(autopsy.teamsNames)[0] || "Ομάδα Αυτοψίας" : "Ομάδα Αυτοψίας",
      contact: autopsy.assignedUserName || "Τεχνικός",
      status: "completed",
      type: "autopsy",
      location: `${autopsy.aDDRESSStreet || ""} ${autopsy.aDDRESSCity || ""}`
    });

    // Generate soilwork appointment if status is appropriate
    if (["ΑΠΟΣΤΟΛΗ", "ΜΗ ΟΛΟΚΛΗΡΩΣΗ", "ΟΛΟΚΛΗΡΩΣΗ"].includes(autopsy.status || "")) {
      const soilworkDate = new Date(createdDate);
      soilworkDate.setDate(createdDate.getDate() + 5);
      
      generatedAppointments.push({
        id: 2,
        title: "Εργασίες Χωματουργικών",
        date: formatAppointmentDate(soilworkDate),
        time: "08:00 - 16:00",
        team: "Ομάδα Χωματουργικών",
        contact: "Μιχάλης Ιωάννου",
        status: autopsy.status === "ΑΠΟΣΤΟΛΗ" ? "in-progress" : "completed",
        type: "soilwork",
        notes: `Εκσκαφή για την εγκατάσταση αγωγών προς CAB ${autopsy.cAB || ""}`,
        location: `${autopsy.aDDRESSStreet || ""} ${autopsy.aDDRESSCity || ""}`
      });
    }

    // Generate construction appointment if status is advanced
    if (["ΜΗ ΟΛΟΚΛΗΡΩΣΗ", "ΟΛΟΚΛΗΡΩΣΗ"].includes(autopsy.status || "")) {
      const constructionDate = new Date(createdDate);
      constructionDate.setDate(createdDate.getDate() + 12);
      
      generatedAppointments.push({
        id: 3,
        title: "Εγκατάσταση Αγωγών",
        date: formatAppointmentDate(constructionDate),
        time: "09:00 - 17:00",
        team: "Ομάδα Κατασκευών",
        contact: "Σοφία Βασιλείου",
        status: autopsy.status === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ" ? "in-progress" : "completed",
        type: "construction",
        location: `${autopsy.aDDRESSStreet || ""} ${autopsy.aDDRESSCity || ""}`
      });
    }

    // Generate customer meeting if appropriate (future appointment)
    if (autopsy.customerName) {
      const meetingDate = new Date();
      meetingDate.setDate(meetingDate.getDate() + 2); // 2 days from today
      
      generatedAppointments.push({
        id: 4,
        title: "Συνάντηση με Πελάτη",
        date: formatAppointmentDate(meetingDate),
        time: "14:00 - 15:00",
        team: "Διαχείριση Έργου",
        contact: autopsy.customerName,
        status: "pending",
        type: "customer",
        notes: "Παρουσίαση προόδου έργου και επόμενων βημάτων",
        location: autopsy.aDDRESSStreet ? `${autopsy.aDDRESSStreet}, ${autopsy.aDDRESSCity || ""}` : "Γραφεία Εταιρείας"
      });
    }

    setAppointments(generatedAppointments);
  }, [autopsy]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!appointmentForm.title || !appointmentForm.date || !appointmentForm.time || !appointmentForm.type) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία",
        variant: "destructive"
      });
      return;
    }

    // Create new appointment
    const newAppointment: Appointment = {
      id: appointments.length + 1,
      title: appointmentForm.title,
      date: appointmentForm.date,
      time: appointmentForm.time,
      team: appointmentForm.team || "Να οριστεί",
      contact: appointmentForm.contact || "Να οριστεί",
      status: "pending",
      type: appointmentForm.type,
      notes: appointmentForm.notes,
      location: `${autopsy.aDDRESSStreet || ""} ${autopsy.aDDRESSCity || ""}`
    };

    // Add to appointments list
    setAppointments([...appointments, newAppointment]);
    
    // Show success toast
    toast({
      title: "Επιτυχία",
      description: "Το ραντεβού δημιουργήθηκε με επιτυχία",
      variant: "success"
    });
    
    // Reset form and close dialog
    setAppointmentForm({
      title: "",
      date: "",
      time: "9:00",
      type: "autopsy",
      team: "",
      contact: "",
      notes: "",
    });
    setShowNewAppointment(false);
  };

  // Get appointments for selected date
  const getAppointmentsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    
    const formattedDate = selectedDate.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return appointments.filter(apt => apt.date === formattedDate);
  };

  // Get status text and badge classes
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          text: "Ολοκληρώθηκε",
          badge: "bg-green-100 text-green-800"
        };
      case "in-progress":
        return {
          text: "Σε Εξέλιξη", 
          badge: "bg-blue-100 text-blue-800"
        };
      case "pending":
        return {
          text: "Εκκρεμεί",
          badge: "bg-yellow-100 text-yellow-800"
        };
      case "cancelled":
        return {
          text: "Ακυρώθηκε",
          badge: "bg-red-100 text-red-800"
        };
      default:
        return {
          text: "Άγνωστο",
          badge: "bg-gray-100 text-gray-800"
        };
    }
  };

  // Get appointment type icon
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case "autopsy":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "soilwork":
        return <FileText className="h-5 w-5 text-brown-600" />;
      case "construction":
        return <FileText className="h-5 w-5 text-yellow-600" />;
      case "splicing":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "technical":
        return <FileText className="h-5 w-5 text-purple-600" />;
      case "customer":
        return <User className="h-5 w-5 text-indigo-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div>
      <Tabs defaultValue="calendar">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Προβολή Ημερολογίου</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Επερχόμενα Ραντεβού</span>
            </TabsTrigger>
          </TabsList>

          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Νέο Ραντεβού</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Προγραμματισμός Νέου Ραντεβού</DialogTitle>
                <DialogDescription>
                  Δημιουργήστε ένα νέο ραντεβού για το έργο SR: {autopsy.name || "N/A"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Τίτλος Ραντεβού</Label>
                  <Input 
                    id="title" 
                    placeholder="Εισάγετε τίτλο ραντεβού" 
                    value={appointmentForm.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Ημερομηνία</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Ώρα</Label>
                    <Select 
                      value={appointmentForm.time}
                      onValueChange={(value) => handleInputChange("time", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Επιλέξτε ώρα" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00">9:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="13:00">13:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Τύπος Ραντεβού</Label>
                  <Select
                    value={appointmentForm.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλέξτε τύπο" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autopsy">Αυτοψία</SelectItem>
                      <SelectItem value="soilwork">Χωματουργικά</SelectItem>
                      <SelectItem value="construction">Κατασκευή</SelectItem>
                      <SelectItem value="splicing">Συγκόλληση</SelectItem>
                      <SelectItem value="technical">Τεχνικός Έλεγχος</SelectItem>
                      <SelectItem value="customer">Συνάντηση με Πελάτη</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="team">Ανατεθειμένη Ομάδα/Άτομο</Label>
                  <Input 
                    id="team" 
                    placeholder="Εισάγετε όνομα ομάδας ή ατόμου" 
                    value={appointmentForm.team}
                    onChange={(e) => handleInputChange("team", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact">Υπεύθυνος Επικοινωνίας</Label>
                  <Input 
                    id="contact" 
                    placeholder="Εισάγετε όνομα υπευθύνου επικοινωνίας" 
                    value={appointmentForm.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Σημειώσεις</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Προσθέστε επιπλέον σημειώσεις ή απαιτήσεις" 
                    value={appointmentForm.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewAppointment(false)}>
                  Ακύρωση
                </Button>
                <Button onClick={handleSubmit}>Προγραμματισμός Ραντεβού</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="calendar" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-3">
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  className="rounded-md border"
                  // Highlight days with appointments
                  modifiers={{
                    highlighted: appointments.map(apt => {
                      const parts = apt.date.split(' ');
                      const day = parseInt(parts[0]);
                      const month = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'].indexOf(parts[1]);
                      const year = parseInt(parts[2]);
                      return new Date(year, month, day);
                    })
                  }}
                  modifiersStyles={{
                    highlighted: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                  }}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">
                  Ραντεβού για {date?.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>

                <div className="space-y-4">
                  {getAppointmentsForDate(date).map((appointment) => {
                    const status = getStatusInfo(appointment.status);
                    
                    return (
                      <div key={appointment.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {getAppointmentTypeIcon(appointment.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{appointment.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.badge}`}>
                              {status.text}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{appointment.time}</p>
                          
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <Briefcase className="h-3 w-3" />
                            <span>{appointment.team}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <User className="h-3 w-3" />
                            <span>{appointment.contact}</span>
                          </div>
                          
                          {appointment.location && (
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {appointment.status !== "completed" && (
                            <>
                              <Button variant="outline" size="sm">
                                Επεξεργασία
                              </Button>
                              
                              {appointment.status === "pending" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-800 border-green-200 hover:border-green-300"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Ολοκλήρωση
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {getAppointmentsForDate(date).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Δεν υπάρχουν προγραμματισμένα ραντεβού για αυτή την ημέρα</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowNewAppointment(true)}>
                        Προσθήκη Ραντεβού
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <div className="space-y-4">
            {appointments
              .sort((a, b) => {
                // Sort first by status (pending first, then in-progress, then completed)
                const statusOrder = { pending: 0, "in-progress": 1, completed: 2, cancelled: 3 };
                const statusA = statusOrder[a.status as keyof typeof statusOrder] || 4;
                const statusB = statusOrder[b.status as keyof typeof statusOrder] || 4;
                
                if (statusA !== statusB) return statusA - statusB;
                
                // Then by date (convert Greek date format to comparable date)
                const parseDate = (dateStr: string) => {
                  const parts = dateStr.split(' ');
                  const day = parseInt(parts[0]);
                  const month = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'].indexOf(parts[1]);
                  const year = parseInt(parts[2]);
                  return new Date(year, month, day);
                };
                
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                
                return dateA.getTime() - dateB.getTime();
              })
              .map((appointment) => {
                const status = getStatusInfo(appointment.status);
                
                return (
                  <div key={appointment.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {getAppointmentTypeIcon(appointment.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{appointment.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.badge}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.date} • {appointment.time}
                      </p>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        <Briefcase className="h-3 w-3" />
                        <span>{appointment.team}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        <User className="h-3 w-3" />
                        <span>{appointment.contact}</span>
                      </div>
                      
                      {appointment.location && (
                        <div className="flex items-center gap-1 mt-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {appointment.status !== "completed" && (
                        <>
                          <Button variant="outline" size="sm">
                            Επεξεργασία
                          </Button>
                          
                          {appointment.status === "pending" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-800 border-green-200 hover:border-green-300"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ολοκλήρωση
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
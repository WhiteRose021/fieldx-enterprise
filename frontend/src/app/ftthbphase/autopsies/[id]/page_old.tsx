"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Loader2,
  Bookmark,
  Send,
  ExternalLink,
  Save,
  X,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { useAutopsy, useUpdateAutopsy, Autopsy } from "@/lib/api/autopsies";
import { useToast } from "@/hooks/use-toast";

// Define the validation schema using Zod
const autopsySchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  pilot: z.string().optional(),
  orderNumber: z.string().optional(),
  cATEGORY: z.string().optional(),
  tTLP: z.string().optional(),
  sxolia: z.string().optional(),
  customerName: z.string().optional(),
  customerMobile: z.string().optional(),
  custonerNumber: z.string().optional().nullable(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  adminName: z.string().optional(),
  adminMobile: z.string().optional(),
  adminNumber: z.string().optional(),
  adminEmail: z.string().email().optional().or(z.literal("")),
  aDDRESSStreet: z.string().optional(),
  aDDRESSCity: z.string().optional(),
  fLOOR: z.string().optional(),
  aDDRESSPostalCode: z.string().optional().nullable(),
  aDDRESSCountry: z.string().optional(),
  aK: z.string().optional(),
  bUILDINGID: z.string().optional(),
  finalBuilding: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  cAB: z.string().optional(),
  cABAddress: z.string().optional(),
  aGETEST: z.union([z.number(), z.string()]).optional(),
  ekswsysthmikh: z.string().optional().nullable(),
  akmul: z.string().optional().nullable(),
  demo: z.string().optional(),
});

type AutopsyFormData = z.infer<typeof autopsySchema>;

interface TabProps {
  active: string;
  onChange: (tab: string) => void;
}

export default function AutopsyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<string>("general");

  // Data fetching with React Query
  const { data: autopsy, isLoading, error, refetch } = useAutopsy(id);

  // Update mutation
  const updateAutopsyMutation = useUpdateAutopsy();

  // Setup form with react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AutopsyFormData>({
    resolver: zodResolver(autopsySchema),
    defaultValues: {
      name: "",
      status: "",
      pilot: "",
      orderNumber: "",
      cATEGORY: "",
      tTLP: "",
      sxolia: "",
      customerName: "",
      customerMobile: "",
      custonerNumber: "",
      customerEmail: "",
      adminName: "",
      adminMobile: "",
      adminNumber: "",
      adminEmail: "",
      aDDRESSStreet: "",
      aDDRESSCity: "",
      fLOOR: "",
      aDDRESSPostalCode: "",
      aDDRESSCountry: "",
      aK: "",
      bUILDINGID: "",
      finalBuilding: "",
      latitude: "",
      longitude: "",
      cAB: "",
      cABAddress: "",
      aGETEST: "",
      ekswsysthmikh: "",
      akmul: "",
      demo: "",
    },
  });

  // Convert the API response to our component's expected structure
  const autopsyData: Partial<Autopsy> & { id: string } = autopsy || { id: "" };

  // Update form default values when data is loaded
  useEffect(() => {
    if (autopsy) {
      reset({
        name: autopsy.name,
        status: autopsy.status,
        pilot: autopsy.pilot,
        orderNumber: autopsy.orderNumber,
        cATEGORY: autopsy.cATEGORY,
        tTLP: autopsy.tTLP,
        sxolia: autopsy.sxolia ?? undefined,
        customerName: autopsy.customerName,
        customerMobile: autopsy.customerMobile,
        custonerNumber: autopsy.custonerNumber,
        customerEmail: autopsy.customerEmail,
        adminName: autopsy.adminName,
        adminMobile: autopsy.adminMobile,
        adminNumber: autopsy.adminNumber,
        adminEmail: autopsy.adminEmail,
        aDDRESSStreet: autopsy.aDDRESSStreet,
        aDDRESSCity: autopsy.aDDRESSCity,
        fLOOR: autopsy.fLOOR,
        aDDRESSPostalCode: autopsy.aDDRESSPostalCode,
        aDDRESSCountry: autopsy.aDDRESSCountry,
        aK: autopsy.aK,
        bUILDINGID: autopsy.bUILDINGID,
        finalBuilding: autopsy.finalBuilding,
        latitude: autopsy.latitude,
        longitude: autopsy.longitude,
        cAB: autopsy.cAB,
        cABAddress: autopsy.cABAddress,
        aGETEST: autopsy.aGETEST,
        ekswsysthmikh: autopsy.ekswsysthmikh,
        akmul: autopsy.akmul,
        demo: autopsy.demo,
      });
    }
  }, [autopsy, reset]);

  // Error handling - redirect to list if autopsy not found
  useEffect(() => {
    if (error) {
      console.error("Error fetching autopsy:", error);
      setTimeout(() => {
        router.push("/ftthbphase/autopsies");
      }, 3000);
    }
  }, [error, router]);

  useEffect(() => {
    console.log("isDirty:", isDirty, "isPending:", updateAutopsyMutation.isPending);
  }, [isDirty, updateAutopsyMutation.isPending]);

  // Helper function for formatting dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function for getting status color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-yellow-100 text-yellow-800 border border-yellow-300";

    const colors: Record<string, string> = {
      ΟΛΟΚΛΗΡΩΣΗ: "bg-green-100 text-green-800 border border-green-300",
      ΑΠΟΣΤΟΛΗ: "bg-blue-100 text-blue-800 border border-blue-300",
      "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
      ΑΠΟΡΡΙΨΗ: "bg-gray-100 text-gray-800 border border-gray-300",
      ΝΕΟ: "bg-purple-100 text-purple-800 border border-purple-300",
    };
    return colors[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
  };

  // Helper function for status icon
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <FileText className="h-5 w-5 text-yellow-600" />;

    switch (status) {
      case "ΟΛΟΚΛΗΡΩΣΗ":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "ΑΠΟΣΤΟΛΗ":
        return <Send className="h-5 w-5 text-blue-600" />;
      case "ΜΗ ΟΛΟΚΛΗΡΩΣΗ":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "ΑΠΟΡΡΙΨΗ":
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      case "ΝΕΟ":
        return <FileText className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Status options
  const statusOptions = ["ΟΛΟΚΛΗΡΩΣΗ", "ΑΠΟΣΤΟΛΗ", "ΜΗ ΟΛΟΚΛΗΡΩΣΗ", "ΑΠΟΡΡΙΨΗ", "ΝΕΟ"];

  const onSubmit = async (data: AutopsyFormData) => {
    console.log("onSubmit triggered with data:", data);
    try {
      if (!autopsyData.id) {
        console.error("Cannot update: Missing autopsy ID");
        toast({
          title: "Σφάλμα",
          description: "Λείπει το αναγνωριστικό της αυτοψίας",
          variant: "destructive",
        });
        return;
      }
  
      const sanitizedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? null : value])
      );
  
      await updateAutopsyMutation.mutateAsync({
        id: autopsyData.id,
        data: sanitizedData as Partial<Autopsy>,
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

  // Cancel editing with confirmation if form is dirty
  const handleCancelEdit = () => {
    if (isDirty) {
      if (!confirm("Είστε σίγουροι ότι θέλετε να ακυρώσετε; Οι μη αποθηκευμένες αλλαγές θα χαθούν.")) {
        return;
      }
    }
    if (autopsy) {
      reset({
        name: autopsy.name,
        status: autopsy.status,
        pilot: autopsy.pilot,
        orderNumber: autopsy.orderNumber,
        cATEGORY: autopsy.cATEGORY,
        tTLP: autopsy.tTLP,
        sxolia: autopsy.sxolia ?? undefined,
        customerName: autopsy.customerName,
        customerMobile: autopsy.customerMobile,
        custonerNumber: autopsy.custonerNumber,
        customerEmail: autopsy.customerEmail,
        adminName: autopsy.adminName,
        adminMobile: autopsy.adminMobile,
        adminNumber: autopsy.adminNumber,
        adminEmail: autopsy.adminEmail,
        aDDRESSStreet: autopsy.aDDRESSStreet,
        aDDRESSCity: autopsy.aDDRESSCity,
        fLOOR: autopsy.fLOOR,
        aDDRESSPostalCode: autopsy.aDDRESSPostalCode,
        aDDRESSCountry: autopsy.aDDRESSCountry,
        aK: autopsy.aK,
        bUILDINGID: autopsy.bUILDINGID,
        finalBuilding: autopsy.finalBuilding,
        latitude: autopsy.latitude,
        longitude: autopsy.longitude,
        cAB: autopsy.cAB,
        cABAddress: autopsy.cABAddress,
        aGETEST: autopsy.aGETEST,
        ekswsysthmikh: autopsy.ekswsysthmikh,
        akmul: autopsy.akmul,
        demo: autopsy.demo,
      });
    }
    setIsEditing(false);
  };

  // Tab Navigation component
  const TabNavigation: React.FC<TabProps> = ({ active, onChange }) => {
    return (
      <div className="border-b mb-6">
        <div className="flex overflow-x-auto hide-scroll-bar">
          <button
            onClick={() => onChange("general")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              active === "general"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Γενικές Πληροφορίες
          </button>
          <button
            onClick={() => onChange("customer")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              active === "customer"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Στοιχεία Πελάτη
          </button>
          <button
            onClick={() => onChange("location")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              active === "location"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Τοποθεσία
          </button>
          <button
            onClick={() => onChange("technical")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              active === "technical"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Τεχνικά Στοιχεία
          </button>
          <button
            onClick={() => onChange("system")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              active === "system"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Στοιχεία Συστήματος
          </button>
        </div>
      </div>
    );
  };

  // Field component for edit mode
  const EditField = ({
    label,
    name,
    control,
    type = "text",
    options = [],
    error,
  }: {
    label: string;
    name: keyof AutopsyFormData;
    control: any;
    type?: string;
    options?: string[];
    error?: { message?: string };
  }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            if (type === "select") {
              return (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Επιλέξτε...</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              );
            } else if (type === "textarea") {
              return (
                <textarea
                  {...field}
                  value={field.value || ""}
                  rows={4}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              );
            } else if (type === "radio") {
              return (
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...field}
                      value="Y"
                      checked={field.value === "Y"}
                      className="mr-2"
                    />
                    Ναι
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...field}
                      value="N"
                      checked={field.value === "N"}
                      className="mr-2"
                    />
                    Όχι
                  </label>
                </div>
              );
            } else {
              return (
                <input
                  type={type}
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              );
            }
          }}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      </div>
    );
  };

  // Loading state
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

  // Error state
  if (error || !autopsy) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <div className="text-xl font-bold text-gray-800 mb-2">Σφάλμα</div>
          <div className="text-gray-600 mb-6">
            Δεν ήταν δυνατή η φόρτωση των στοιχείων της αυτοψίας. Ανακατεύθυνση...
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

  return (
    <AuthenticatedLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Breadcrumbs */}
        <Breadcrumb pageName="Λεπτομέρειες Αυτοψίας" />

        {/* Back button and main title */}
        <div className="mb-6">
          <Link
            href="/ftthbphase/autopsies"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Επιστροφή στη λίστα</span>
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="text-2xl font-bold text-gray-900 border-b border-blue-500 focus:outline-none focus:border-blue-700 bg-transparent"
                        placeholder="Όνομα αυτοψίας"
                      />
                    )}
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {"name" in autopsyData ? autopsyData.name || "Χωρίς όνομα" : "Χωρίς όνομα"}
                  </h1>
                )}

                {isEditing ? (
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        value={field.value || ""}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(field.value)}`}
                      >
                        <option value="">Επιλέξτε κατάσταση</option>
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(autopsyData.status ?? "")}`}
                  >
                    {"status" in autopsyData ? autopsyData.status || "Άγνωστη κατάσταση" : "Άγνωστη κατάσταση"}
                  </span>
                )}

                {isEditing ? (
                  <Controller
                    name="pilot"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        value={field.value || ""}
                        className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-sm font-medium"
                      >
                        <option value="">Επιλέξτε...</option>
                        <option value="Y">Pilot</option>
                        <option value="N">Όχι Pilot</option>
                      </select>
                    )}
                  />
                ) : (
                  autopsyData.pilot === "Y" && (
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-sm font-medium">
                      Pilot
                    </span>
                  )
                )}
              </div>
              <div className="text-gray-600">
                <span className="inline-flex items-center">
                  <Calendar className="h-4 w-4 mr-2" /> Δημιουργήθηκε: {formatDate(autopsyData.createdAt ?? "")}
                </span>
                <span className="inline-flex items-center ml-4">
                  <Clock className="h-4 w-4 mr-2" /> Τελευταία τροποποίηση: {formatDate(autopsyData.modifiedAt)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Ακύρωση
                  </button>

                  {console.log("Rendering Save button - isDirty:", isDirty, "isPending:", updateAutopsyMutation.isPending)}
                  {console.log("Save button disabled value:", !isDirty || updateAutopsyMutation.isPending)}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 rounded-lg text-white font-medium flex items-center hover:bg-green-700 transition-colors"
                   // disabled={!isDirty || updateAutopsyMutation.isPending}
                  >
                    {updateAutopsyMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Αποθήκευση...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Αποθήκευση
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <Bookmark className="h-5 w-5 mr-2" />
                    Αποθήκευση
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium flex items-center hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Επεξεργασία
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <TabNavigation active={activeTab} onChange={setActiveTab} />

          {/* Tab Content */}
          <div>
            {/* General Information */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Βασικά Στοιχεία</h2>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <EditField label="SR" name="name" control={control} error={errors.name} />
                      <EditField
                        label="Αριθμός Παραγγελίας"
                        name="orderNumber"
                        control={control}
                        error={errors.orderNumber}
                      />
                      <EditField
                        label="Κατάσταση"
                        name="status"
                        control={control}
                        type="select"
                        options={statusOptions}
                        error={errors.status}
                      />
                      <EditField label="Κατηγορία" name="cATEGORY" control={control} error={errors.cATEGORY} />
                      <EditField label="TTLP" name="tTLP" control={control} error={errors.tTLP} />
                      <EditField label="Pilot" name="pilot" control={control} type="radio" error={errors.pilot} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">SR</p>
                        <p className="font-medium">{autopsyData.name || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Αριθμός Παραγγελίας</p>
                        <p className="font-medium">{autopsyData.orderNumber || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Κατάσταση</p>
                        <div className="flex items-center">
                          {getStatusIcon(autopsyData.status)}
                          <span className="ml-2 font-medium">{autopsyData.status || "N/A"}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Κατηγορία</p>
                        <p className="font-medium">{autopsyData.cATEGORY || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">TTLP</p>
                        <p className="font-medium">{autopsyData.tTLP || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Pilot</p>
                        <p className="font-medium">{autopsyData.pilot === "Y" ? "Ναι" : "Όχι"}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Σχόλια</h2>
                  {isEditing ? (
                    <EditField
                      label="Σχόλια"
                      name="sxolia"
                      control={control}
                      type="textarea"
                      error={errors.sxolia}
                    />
                  ) : autopsyData.sxolia ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      {autopsyData.sxolia}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Δεν υπάρχουν σχόλια</p>
                  )}
                </div>
              </div>
            )}

            {/* Customer Information */}
            {activeTab === "customer" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Στοιχεία Πελάτη</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <User className="h-6 w-6 text-blue-600 mr-3" />
                        <h3 className="text-lg font-medium">Πελάτης</h3>
                      </div>
                      {isEditing ? (
                        <div className="space-y-4">
                          <EditField
                            label="Ονοματεπώνυμο"
                            name="customerName"
                            control={control}
                            error={errors.customerName}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <EditField
                              label="Κινητό"
                              name="customerMobile"
                              control={control}
                              error={errors.customerMobile}
                            />
                            <EditField
                              label="Σταθερό"
                              name="custonerNumber"
                              control={control}
                              error={errors.custonerNumber}
                            />
                          </div>
                          <EditField
                            label="Email"
                            name="customerEmail"
                            control={control}
                            type="email"
                            error={errors.customerEmail}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-500">Ονοματεπώνυμο</label>
                            <p className="font-medium">{autopsyData.customerName || "N/A"}</p>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <label className="text-sm text-gray-500">Κινητό</label>
                              <p className="font-medium flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-1" />
                                {autopsyData.customerMobile || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Σταθερό</label>
                              <p className="font-medium flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-1" />
                                {autopsyData.custonerNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium flex items-center">
                              <Mail className="h-4 w-4 text-gray-500 mr-1" />
                              {autopsyData.customerEmail || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <Briefcase className="h-6 w-6 text-blue-600 mr-3" />
                        <h3 className="text-lg font-medium">Διαχειριστής</h3>
                      </div>
                      {isEditing ? (
                        <div className="space-y-4">
                          <EditField
                            label="Ονοματεπώνυμο"
                            name="adminName"
                            control={control}
                            error={errors.adminName}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <EditField
                              label="Κινητό"
                              name="adminMobile"
                              control={control}
                              error={errors.adminMobile}
                            />
                            <EditField
                              label="Σταθερό"
                              name="adminNumber"
                              control={control}
                              error={errors.adminNumber}
                            />
                          </div>
                          <EditField
                            label="Email"
                            name="adminEmail"
                            control={control}
                            type="email"
                            error={errors.adminEmail}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-500">Ονοματεπώνυμο</label>
                            <p className="font-medium">{autopsyData.adminName || "N/A"}</p>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <label className="text-sm text-gray-500">Κινητό</label>
                              <p className="font-medium flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-1" />
                                {autopsyData.adminMobile || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Σταθερό</label>
                              <p className="font-medium flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-1" />
                                {autopsyData.adminNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium flex items-center">
                              <Mail className="h-4 w-4 text-gray-500 mr-1" />
                              {autopsyData.adminEmail || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Information */}
            {activeTab === "location" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Διεύθυνση</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <EditField
                            label="Οδός"
                            name="aDDRESSStreet"
                            control={control}
                            error={errors.aDDRESSStreet}
                          />
                          <EditField
                            label="Πόλη"
                            name="aDDRESSCity"
                            control={control}
                            error={errors.aDDRESSCity}
                          />
                          <EditField label="Όροφος" name="fLOOR" control={control} error={errors.fLOOR} />
                          <EditField
                            label="Ταχ. Κώδικας"
                            name="aDDRESSPostalCode"
                            control={control}
                            error={errors.aDDRESSPostalCode}
                          />
                          <EditField
                            label="Χώρα"
                            name="aDDRESSCountry"
                            control={control}
                            error={errors.aDDRESSCountry}
                          />
                          <EditField label="AK manholes" name="aK" control={control} error={errors.aK} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Οδός</p>
                            <p className="font-medium">{autopsyData.aDDRESSStreet || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Πόλη</p>
                            <p className="font-medium">{autopsyData.aDDRESSCity || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Όροφος</p>
                            <p className="font-medium">{autopsyData.fLOOR || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Ταχ. Κώδικας</p>
                            <p className="font-medium">{autopsyData.aDDRESSPostalCode || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Χώρα</p>
                            <p className="font-medium">{autopsyData.aDDRESSCountry || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">AK manholes</p>
                            <p className="font-medium">{autopsyData.aK || "N/A"}</p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-blue-800">Στοιχεία Κτιρίου</h3>
                        </div>
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <EditField
                              label="ID Κτιρίου"
                              name="bUILDINGID"
                              control={control}
                              error={errors.bUILDINGID}
                            />
                            <EditField
                              label="Τελικό Κτίριο"
                              name="finalBuilding"
                              control={control}
                              error={errors.finalBuilding}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-blue-700 mb-1">ID Κτιρίου</p>
                              <p className="font-medium">{autopsyData.bUILDINGID || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700 mb-1">Τελικό Κτίριο</p>
                              <p className="font-medium">
                                {autopsyData.finalBuilding
                                  ? autopsyData.finalBuilding.replace(/<[^>]*>/g, "")
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1 min-h-[300px] rounded-lg border overflow-hidden relative">
                      {isEditing ? (
                        <div className="p-4">
                          <h3 className="font-medium mb-3">Συντεταγμένες</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <EditField
                              label="Latitude"
                              name="latitude"
                              control={control}
                              error={errors.latitude}
                            />
                            <EditField
                              label="Longitude"
                              name="longitude"
                              control={control}
                              error={errors.longitude}
                            />
                          </div>
                        </div>
                      ) : autopsyData.latitude && autopsyData.longitude ? (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="font-medium mb-1">Συντεταγμένες:</p>
                            <p className="text-sm text-gray-600">
                              {autopsyData.latitude}, {autopsyData.longitude}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${autopsyData.latitude},${autopsyData.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              Άνοιγμα σε Google Maps
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Δεν υπάρχουν διαθέσιμες συντεταγμένες</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Information */}
            {activeTab === "technical" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Τεχνικά Στοιχεία</h2>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <EditField label="CAB" name="cAB" control={control} error={errors.cAB} />
                      <EditField
                        label="Διεύθυνση CAB"
                        name="cABAddress"
                        control={control}
                        error={errors.cABAddress}
                      />
                      <EditField label="AGE Test" name="aGETEST" control={control} error={errors.aGETEST} />
                      <EditField
                        label="Εξωσυστημική"
                        name="ekswsysthmikh"
                        control={control}
                        type="select"
                        options={["Ναι", "Όχι"]}
                        error={errors.ekswsysthmikh}
                      />
                      <EditField label="AK MUL" name="akmul" control={control} error={errors.akmul} />
                      <EditField label="Demo" name="demo" control={control} error={errors.demo} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">CAB</p>
                        <p className="font-medium">{autopsyData.cAB || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Διεύθυνση CAB</p>
                        <p className="font-medium">{autopsyData.cABAddress || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">AGE Test</p>
                        <p className="font-medium">{autopsyData.aGETEST || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Εξωσυστημική</p>
                        <p className="font-medium">{autopsyData.ekswsysthmikh || "Όχι"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">AK MUL</p>
                        <p className="font-medium">{autopsyData.akmul || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Demo</p>
                        <p className="font-medium">{autopsyData.demo || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Information - Always Read-Only */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Στοιχεία Συστήματος</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">ID</p>
                      <p className="font-medium">{autopsyData.id}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Ημερομηνία Δημιουργίας</p>
                      <p className="font-medium">{formatDate(autopsyData.createdAt)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Δημιουργήθηκε από</p>
                      <p className="font-medium">{autopsyData.createdByName || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Ημερομηνία Τροποποίησης</p>
                      <p className="font-medium">{formatDate(autopsyData.modifiedAt)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Τροποποιήθηκε από</p>
                      <p className="font-medium">{autopsyData.modifiedByName || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Ανατέθηκε σε</p>
                      <p className="font-medium">{autopsyData.assignedUserName || "Μη ανατεθειμένο"}</p>
                    </div>
                  </div>

                  {autopsyData.teamsIds && autopsyData.teamsIds.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-800 mb-3">Ομάδες</h3>
                      <div className="flex flex-wrap gap-2">
                        {autopsyData.teamsIds.map((id) => (
                          <span
                            key={id}
                            className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm"
                          >
                            {autopsyData.teamsNames && autopsyData.teamsNames[id]
                              ? autopsyData.teamsNames[id]
                              : id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Building } from "lucide-react";
import { Autopsy } from "@/lib/api/autopsies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerInfoProps {
  autopsy: Autopsy;
  isEditing?: boolean;
}

export function CustomerInfo({ autopsy, isEditing = false }: CustomerInfoProps) {
  // Extract address as a formatted string
  const formattedAddress = [
    autopsy.aDDRESSStreet,
    autopsy.aDDRESSCity,
    autopsy.aDDRESSPostalCode,
    autopsy.aDDRESSCountry,
  ]
    .filter(Boolean)
    .join(", ") || "Δεν έχει καταχωρηθεί διεύθυνση";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Ονοματεπώνυμο Πελάτη</Label>
              <Input id="customerName" defaultValue={autopsy.customerName || ""} />
            </div>
            <div>
              <Label htmlFor="customerMobile">Κινητό Πελάτη</Label>
              <Input id="customerMobile" defaultValue={autopsy.customerMobile || ""} />
            </div>
            <div>
              <Label htmlFor="custonerNumber">Σταθερό Πελάτη</Label>
              <Input id="custonerNumber" defaultValue={autopsy.custonerNumber || ""} />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email Πελάτη</Label>
              <Input id="customerEmail" defaultValue={autopsy.customerEmail || ""} type="email" />
            </div>
            <div>
              <Label htmlFor="address">Διεύθυνση</Label>
              <Input id="aDDRESSStreet" defaultValue={autopsy.aDDRESSStreet || ""} placeholder="Οδός" className="mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <Input id="aDDRESSCity" defaultValue={autopsy.aDDRESSCity || ""} placeholder="Πόλη" />
                <Input id="aDDRESSPostalCode" defaultValue={autopsy.aDDRESSPostalCode || ""} placeholder="ΤΚ" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">{autopsy.customerName || "Μη καταχωρημένο όνομα"}</h3>
                <p className="text-sm text-muted-foreground">Πελάτης</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formattedAddress}</span>
              </div>
              {autopsy.customerMobile && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{autopsy.customerMobile}</span>
                </div>
              )}
              {autopsy.custonerNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{autopsy.custonerNumber} (Σταθερό)</span>
                </div>
              )}
              {autopsy.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{autopsy.customerEmail}</span>
                </div>
              )}
              {autopsy.finalBuilding && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Τύπος Κτιρίου: {autopsy.finalBuilding.replace(/<[^>]*>/g, "")}
                  </span>
                </div>
              )}
              {autopsy.fLOOR && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Όροφος: {autopsy.fLOOR}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminName">Ονοματεπώνυμο Διαχειριστή</Label>
              <Input id="adminName" defaultValue={autopsy.adminName || ""} />
            </div>
            <div>
              <Label htmlFor="adminMobile">Κινητό Διαχειριστή</Label>
              <Input id="adminMobile" defaultValue={autopsy.adminMobile || ""} />
            </div>
            <div>
              <Label htmlFor="adminNumber">Σταθερό Διαχειριστή</Label>
              <Input id="adminNumber" defaultValue={autopsy.adminNumber || ""} />
            </div>
            <div>
              <Label htmlFor="adminEmail">Email Διαχειριστή</Label>
              <Input id="adminEmail" defaultValue={autopsy.adminEmail || ""} type="email" />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-md font-medium">Στοιχεία Διαχειριστή</h3>
            {(autopsy.adminName || autopsy.adminMobile || autopsy.adminEmail) ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{autopsy.adminName || "Μη καταχωρημένο όνομα"}</p>
                    <p className="text-xs text-muted-foreground">Διαχειριστής</p>
                    {autopsy.adminEmail && <p className="text-xs">{autopsy.adminEmail}</p>}
                  </div>
                </div>

                {autopsy.adminMobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{autopsy.adminMobile}</span>
                  </div>
                )}
                
                {autopsy.adminNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{autopsy.adminNumber} (Σταθερό)</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Δεν έχουν καταχωρηθεί στοιχεία διαχειριστή</p>
            )}
          </>
        )}

        {!isEditing && (
          <div className="flex gap-2 mt-4">
            {autopsy.customerMobile && (
              <Button className="flex items-center gap-1 outline outline-1 outline-gray-300 text-sm px-2 py-1">
                <Phone className="h-3 w-3" />
                <span>Κλήση</span>
              </Button>
            )}
            {autopsy.customerEmail && (
              <Button className="flex items-center gap-1 outline outline-1 outline-gray-300 text-sm px-2 py-1">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </Button>
            )}
            <Button className="outline outline-1 outline-gray-300 text-sm px-2 py-1">
              Προβολή Ιστορικού
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
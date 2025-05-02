"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type Student = {
  id: string;
  fullName: string;
  matricNumber: string;
  faculty: string;
  department: string;
  photoUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: any;
};

interface StudentDetailsProps {
  student: Student;
  onUpdateStatus: (
    studentId: string,
    status: "Pending" | "Verified" | "Rejected"
  ) => void;
}

export function StudentDetails({
  student,
  onUpdateStatus,
}: StudentDetailsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{student.fullName}</CardTitle>
          <Badge
            className={
              student.status === "Verified"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : student.status === "Rejected"
                ? "bg-red-100 text-red-800 hover:bg-red-100"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            }
          >
            {student.status === "Verified" && (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            {student.status === "Rejected" && (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {student.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
            {student.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-200">
              <img
                src={student.photoUrl || "/placeholder.svg"}
                alt={student.fullName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Matric Number</p>
              <p className="font-medium">{student.matricNumber}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Faculty</p>
              <p>{student.faculty}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p>{student.department}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={() => onUpdateStatus(student.id, "Verified")}
            disabled={student.status === "Verified"}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify
          </Button>

          <Button
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onUpdateStatus(student.id, "Rejected")}
            disabled={student.status === "Rejected"}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>

          <Button
            variant="outline"
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            onClick={() => onUpdateStatus(student.id, "Pending")}
            disabled={student.status === "Pending"}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

import React from "react";
import Image from "next/image";
import { User } from "@/types/user";
import { IdCard, Mail, User as UserIcon } from "lucide-react";

const UserInfo: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="border shadow-md rounded-lg p-6 h-full">
      <div className="flex flex-col items-center mb-4">
        <Image
          src="/placeholder-user-pfp.jpg"
          alt="Profile"
          width={160}
          height={160}
          className="rounded-full mb-4 w-5/6"
          priority
        />
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <UserIcon className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{user.fullname}</h2>
          </div>
          <hr className="m-2 border-primary/20" />
          <div className="flex items-center justify-center space-x-2">
            <IdCard className="h-4 w-4" />
            <p className="font-bold">{user.userid}</p>
          </div>
          <hr className="m-2 border-primary/20" />
          <div className="flex items-center justify-center space-x-2">
            <Mail className="h-4 w-4" />
            <p className="truncate max-w-64 overflow-hidden">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;

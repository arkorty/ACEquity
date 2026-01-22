import React from "react";
import Image from "next/image";
import { User } from "@/types/user";
import { Card, CardContent } from "@/components/ui/card";

const UserInfo: React.FC<{ user: User }> = ({ user }) => {
  return (
    <Card className="border shadow-sm h-full flex flex-col">
      <CardContent className="p-4 md:p-6 flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center w-full">
          <Image
            src="/placeholder-user-pfp.jpg"
            alt="Profile"
            width={320}
            height={320}
            className="rounded-full mb-4 object-cover"
            priority
          />
          <div className="text-center w-full space-y-2">
            <h2 className="text-lg md:text-xl font-bold">{user.fullname}</h2>
            <div className="text-sm font-mono text-muted-foreground">
              {user.userid}
            </div>
            <div className="text-sm text-muted-foreground truncate max-w-full px-2">
              {user.email}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfo;

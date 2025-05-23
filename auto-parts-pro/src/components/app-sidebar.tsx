import {
  BoltIcon,
  BookOpenIcon,
  BookUserIcon,
  CarFrontIcon,
  CarIcon,
  HomeIcon,
  WrenchIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Repair Orders",
    url: "/repair-orders",
    icon: WrenchIcon,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: CarIcon,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: BookUserIcon,
  },
  {
    title: "Parts",
    url: "/parts",
    icon: BoltIcon,
  },
  {
    title: "Documentation",
    url: "/docs",
    icon: BookOpenIcon,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <CarFrontIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Auto Parts Pro</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Aplicación</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

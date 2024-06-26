import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors"

export const prisma = new PrismaClient();

function routes(app: Express) {

  app.use(cors())

//pogs market APIs
  app.get("/api/pogs", async (req: Request, res: Response) => {
    try {
      const pogs = await prisma.pogs.findMany();
      res.status(200).json(pogs); 
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }

  })

  app.get("/api/pogs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const pog = await prisma.pogs.findUnique({
        where: {
          id: parseInt(id)
        }
      });

      if (!pog) {
        return res.status(404).json({ error: 'Pog not found' });
      }

      res.status(200).json(pog);
    } catch {
      res.status(500).json({ error: 'Internal Server Error' })
    }

  });

  app.put("/api/pogs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { current_price } = req.body


      const pog = await prisma.pogs.findUnique({
        where: {
          id: parseInt(id)
        },
      })

      if (!pog) {
        return res.status(404).json({ error: 'Pog not found' });
      }

      const previous_price = pog.current_price

      const updatedValue = prisma.pogs.update({
        where: {
          id: parseInt(id)
        },
        data: {
          previous_price,
          current_price
        }
      })
      res.status(201).json(updatedValue)

    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  // user-owned Pogs APIs (GET all, POST, DELETE only)
  app.get("/api/user/:userid/pogs", async (req: Request, res: Response) => {
    try {
      const userPogs = await prisma.userPogs.findMany({
        where: {
          user_id: parseInt(req.params.userid)
        }
      })

      const pogs = await prisma.pogs.findMany({
        where: {
          id: {
            in: userPogs.map((userPog) => userPog.pogs_id)
          }
        }
      })

      res.status(200).json(pogs)
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  app.post("/api/user/:userid/pogs/:pogsid", async (req: Request, res: Response) => {
    try {
      // const { name, email, password } = req.body

      const newUserPogs = await prisma.userPogs.create({
        data: {
          user_id: parseInt(req.params.userid),
          pogs_id: parseInt(req.params.pogsid)
        }
      })

      res.status(201).json(newUserPogs)
    } catch {
      res.status(500).json({ error: 'Internal Service Error: User-Pogs not posted'})
    }
  })

  app.delete("/api/user/:userid/pogs/:pogsid", async (req: Request, res: Response) => {
    try {
      const userPogs = await prisma.userPogs.findMany({
        where: {
          user_id: parseInt(req.params.userid),
          pogs_id: parseInt(req.params.pogsid)
        }
      })

      if (!userPogs) {
        return res.status(404).json({ error: 'User-owned Pogs not found'})
      }

      for (let i = 0; i < userPogs.length; i++) {
        await prisma.userPogs.delete({
          where: {
            id: userPogs[i].id
          }
        })
      }
      
      res.status(202).json({ message: 'Pog has been deleted' })
    } catch (error) {
      console.error("Error deleting user-pog association:", error);
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  // user information APIs
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany()
      res.status(200).json(users)
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  app.get("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(id)
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user)
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  app.post("/api/user", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password,
          is_admin: true,
          wallet: 10000,
        }
      })

      res.status(201).json(newUser)
    } catch {
      res.status(500).json({ error: 'Internal Service Error'})
    }
  })

  app.put("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { wallet } = req.body

      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(id)
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found'})
      }

      const updatedWallet = await prisma.user.update({
        where: {
          id: parseInt(id)
        },
        data: {
          wallet
        }
      })

      res.status(201).json(updatedWallet)
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

  app.delete("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(id)
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found'})
      }

      await prisma.user.delete({
        where: {
          id: parseInt(id)
        },
      })

      res.status(202).json({  message: 'User deleted successfully' })
    } catch {
      res.status(500).json({ error: 'Internal Server Error'})
    }
  })

//admin side APIs
  app.get("/api/admin/pogs", async (req: Request, res: Response) => {
    try {
      const adminPogs = await prisma.pogs.findMany()
      res.status(200).json(adminPogs)

    } catch {
      res.status(500).json({ error: 'Interal Server Error'})
    }

  })

  app.get("/api/admin/pogs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const adminPog = await prisma.pogs.findUnique({
        where: {
          id: parseInt(id)
        }
      })

      if (!adminPog) {
        return res.status(404).json({ error: 'Pog not found' });
      }

      res.status(200).json(adminPog)

    } catch {
      res.status(500).json({ error: 'Interal Server Error'})
    }

  })

  app.post("/api/admin/pogs", async (req: Request, res: Response) => {
    try {
      const { name, ticker_symbol, current_price, color} = req.body
  
      const newPogs = await prisma.pogs.create({
        data: {
          name,
          ticker_symbol,
          previous_price: 0,
          current_price,
          color
        }
      }
      )
  
      res.status(201).json(newPogs);
    } catch {
      return res.status(500).json({ error: 'Internal Server Error'})
    }

  })

  app.put("/api/admin/pogs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, ticker_symbol, previous_price, current_price, color } = req.body;

      const pog = await prisma.pogs.findUnique({
        where: {
          id: parseInt(id)
        },
      })

      if (!pog) {
        return res.status(404).json({ error: 'Pog not found' });
      }
    
      const updatedPog = await prisma.pogs.update({
        where: {
          id: parseInt(id)
        },
        data: {
          name,
          ticker_symbol,
          previous_price,
          current_price,
          color
        }
      });
    
      res.status(200).json(updatedPog);
    } catch {
      res.status(500).json({ error: "Internal Server Error"})
    }
  
  });

  app.delete("/api/admin/pogs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const pog = await prisma.pogs.findUnique({
        where: {
          id: parseInt(id)
        },
      })

      if (!pog) {
        return res.status(404).json({ error: 'Pog not found' });
      }
  
      await prisma.pogs.delete({
        where: {
          id: parseInt(id)
        }
      });
      res.status(202).json({ message: "Pogs deleted successfully" });
    } catch {
      res.status(500).json({ error: "Internal Server Error"})
    }

  });


}

export default routes;

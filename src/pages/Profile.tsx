import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Avatar, Button, Container, Typography } from "@mui/material";
import { useQuery } from "react-query";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { extractDiscordFromUser } from "../helpers/discordHelper";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 150 },
  {
    field: "img",
    headerName: "Image",
    renderCell: (params: GridRenderCellParams<any, any>) => (
      <Avatar alt="Champion Icon" src={params.value} />
    ),
  },
];

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { isDiscordUser, discordId } = extractDiscordFromUser(user);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);
  const [rows, setRows] =
    useState<any[]>([]);
  const [stats, setStats] =
    useState<any>({});

  if (!isDiscordUser) {
    return (
      <Container>
        <Typography variant="h4" component="h4" align="center">
          Profile
        </Typography>
        <Typography>
          Profile features are currently only supported for discord login
        </Typography>
      </Container>
    );
  }

  const championsQuery = useQuery("data-champions", async () => {
    const championsResponse = await fetch(
      process.env.REACT_APP_HTTP_ENDPOINT +
        "/players/" +
        discordId +
        "/champions"
    );
    const champions = await championsResponse.json();
    return { champions };
  });

  const statsQuery = useQuery("data-stats", async () => {
    const statsResponse =  await fetch(
      process.env.REACT_APP_HTTP_ENDPOINT +
        "/players/" +
        discordId +
        "/stats"
    );
    return await statsResponse.json();
  });

  useEffect(() => {
    if (statsQuery.status === "success") {
      setStats(statsQuery.data);
    }
  }, [statsQuery.status, statsQuery.data]);


  useEffect(() => {
    if (championsQuery.status === "success") {
      setRows(championsQuery.data
        ? championsQuery.data.champions.map(
            (x: { name: string; id: string; img: string; owned: boolean }) => {
              return {
                id: x.id,
                name: x.name,
                img: x.img,
              };
            }
          )
        : []);
      const selectedRow = championsQuery.data
        ? championsQuery.data.champions
            .filter((x: any) => x.owned)
            .map(
              (x: {
                name: string;
                id: string;
                img: string;
                owned: boolean;
              }) => {
                return x.id;
              }
            )
        : [];

      setRowSelectionModel(selectedRow);
    }
  }, [championsQuery.status, championsQuery.data]);

  const updateChampions = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
      },
    });
    const payload = rows.map((x) => {
      return {
        id: x.id,
        owned: rowSelectionModel.includes(x.id)
      }
    }); 
    await fetch(
      process.env.REACT_APP_HTTP_ENDPOINT +
        "/players/" +
        discordId +
        "/champions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
  };

  return (
    <Container>
      <Typography variant="h4" component="h4" align="center">
        Profile
      </Typography>
      <Typography variant="body1" component="p" align="center">
        User: {user?.nickname}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Game Played : {stats?.numberOfGame}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Number of Reroll : {stats?.totalRoll}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Win Rate : {stats?.numberOfGame / stats?.totalRoll * 100}
      </Typography>
      <Button onClick={updateChampions}>Update Champions</Button>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
      />
    </Container>
  );
};

export default Profile;

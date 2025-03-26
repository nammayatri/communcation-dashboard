import React from 'react';
import { Link } from 'react-router-dom';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';
import LayersIcon from '@mui/icons-material/Layers';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import ListIcon from '@mui/icons-material/List';

const Navigation: React.FC = () => {
  return (
    <List>
      <ListItem>
        <ListItemButton component={Link} to="/alert-centre">
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Alert Centre" />
        </ListItemButton>
      </ListItem>
      <ListItem>
        <ListItemButton component={Link} to="/alert-centre-list">
          <ListItemIcon>
            <ListIcon />
          </ListItemIcon>
          <ListItemText primary="Alert Centre List" />
        </ListItemButton>
      </ListItem>
      <ListItem>
        <ListItemButton component={Link} to="/messages">
          <ListItemIcon>
            <MessageIcon />
          </ListItemIcon>
          <ListItemText primary="Messages" />
        </ListItemButton>
      </ListItem>
      <ListItem>
        <ListItemButton component={Link} to="/overlay">
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primary="Overlay" />
        </ListItemButton>
      </ListItem>
      <ListItem>
        <ListItemButton component={Link} to="/banner">
          <ListItemIcon>
            <ViewCarouselIcon />
          </ListItemIcon>
          <ListItemText primary="Banner" />
        </ListItemButton>
      </ListItem>
    </List>
  );
};

export default Navigation; 
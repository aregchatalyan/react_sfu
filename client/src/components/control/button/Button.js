const Button = ({ active = undefined, colors = undefined, icon, action }) => (
  <button style={
    {
      backgroundColor: active === undefined
        ? 'black'
        : active
          ? colors.active
          : colors.inactive
    }
  }
          onClick={action}>
    <div>
      <i style={
        {
          color: active === undefined
            ? 'white'
            : !active && colors
              ? colors.active
              : colors.inactive
        }
      }
         className={`fas fa-${icon}`}/>
    </div>
  </button>
);

export default Button;
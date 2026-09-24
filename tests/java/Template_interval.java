import java.util.*;

public class Template_interval {
static List<int[]> merge(int[][] a) {
    Arrays.sort(a,(x,y)->Integer.compare(x[0],y[0]));
    List<int[]> out=new ArrayList<>();
    for(int[] range:a) {
        if(out.isEmpty() || out.get(out.size()-1)[1]<range[0]) out.add(range.clone());
        else out.get(out.size()-1)[1]=Math.max(out.get(out.size()-1)[1],range[1]);
    }
    return out; // Sorts the input's outer array.
}
}

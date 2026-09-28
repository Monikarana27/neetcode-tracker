import java.util.*;

public class Template_backtrack {
static void subsets(int[] a,int start,List<Integer> path,List<List<Integer>> out) {
    out.add(new ArrayList<>(path));
    for(int i=start;i<a.length;i++) {
        path.add(a[i]); subsets(a,i+1,path,out); path.remove(path.size()-1);
    }
} // Call with start 0 and empty lists. Distinct input values assumed.

}
